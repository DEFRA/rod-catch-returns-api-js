import { extractRiverId, extractSubmissionId } from '../utils/entity-utils.js'
import {
  getActivityAndSubmissionByActivityId,
  isActivityExists
} from '../services/activities.service.js'
import Joi from 'joi'
import { getSubmission } from '../services/submissions.service.js'
import { isFMTOrAdmin } from '../utils/auth-utils.js'
import { isLeapYear } from '../utils/date-utils.js'
import { isRiverInternal } from '../services/rivers.service.js'

const MAX_DAYS_LEAP_YEAR = 168
const MAX_DAYS_NON_LEAP_YEAR = 167

class JoiExternalValidationError extends Error {
  constructor(code, context = {}) {
    super(code)
    this.code = code
    this.context = context
  }
}

const validateDaysFishedOther = (values, fmtOrAdmin) => {
  if (
    !fmtOrAdmin &&
    values.daysFishedOther < 1 &&
    values.daysFishedWithMandatoryRelease < 1
  ) {
    throw new JoiExternalValidationError(
      'ACTIVITY_DAYS_FISHED_NOT_GREATER_THAN_ZERO',
      {
        property: 'daysFishedOther',
        value: values.daysFishedOther
      }
    )
  }
}

const validateDaysFishedWithMandatoryRelease = (values, submission) => {
  const maxDaysFished = isLeapYear(submission.season)
    ? MAX_DAYS_LEAP_YEAR
    : MAX_DAYS_NON_LEAP_YEAR

  if (values.daysFishedWithMandatoryRelease > maxDaysFished) {
    throw new JoiExternalValidationError(
      'ACTIVITY_DAYS_FISHED_WITH_MANDATORY_RELEASE_MAX_EXCEEDED',
      {
        property: 'daysFishedWithMandatoryRelease',
        value: values.daysFishedWithMandatoryRelease
      }
    )
  }
}

const validateRiver = (values, riverInternal, fmtOrAdmin) => {
  if (riverInternal && !fmtOrAdmin) {
    throw new JoiExternalValidationError('ACTIVITY_RIVER_FORBIDDEN', {
      property: 'river',
      value: values.river
    })
  }
}

const validateActivityExists = (values, activityExists) => {
  if (activityExists) {
    throw new JoiExternalValidationError('ACTIVITY_RIVER_DUPLICATE_FOUND', {
      property: 'river',
      value: values.river
    })
  }
}

const unwrap = (result) => {
  if (result.status === 'rejected') {
    throw result.reason
  }
  return result.value
}

export const validateActivityAsync = async (values, helper) => {
  try {
    const submissionId = extractSubmissionId(values.submission)
    const riverId = extractRiverId(values.river)
    const fmtOrAdmin = isFMTOrAdmin(helper?.prefs?.context?.auth?.role)

    const results = await Promise.allSettled([
      getSubmission(submissionId),
      isRiverInternal(riverId),
      isActivityExists(submissionId, riverId)
    ])

    const [submission, riverInternal, activityExists] = results.map(unwrap)

    if (!submission) {
      throw new JoiExternalValidationError('ACTIVITY_SUBMISSION_NOT_FOUND', {
        value: values.submission,
        property: 'submission'
      })
    }

    validateDaysFishedWithMandatoryRelease(values, submission)
    validateDaysFishedOther(values, fmtOrAdmin)
    validateRiver(values, riverInternal, fmtOrAdmin)
    validateActivityExists(values, activityExists)

    return values
  } catch (err) {
    if (err instanceof JoiExternalValidationError) {
      return helper.message(err.code, err.context)
    }
    throw err
  }
}

export const validateUpdateActivityAsync = async (values, helper) => {
  try {
    const activityId = helper.prefs.context.params.activityId
    const fmtOrAdmin = isFMTOrAdmin(helper?.prefs?.context?.auth?.role)

    const activity = await getActivityAndSubmissionByActivityId(activityId)

    if (!activity) {
      throw new JoiExternalValidationError('ACTIVITY_SUBMISSION_NOT_FOUND', {
        value: values.submission,
        property: 'submission'
      })
    }

    const submission = activity.Submission

    const combinedValues = {
      daysFishedWithMandatoryRelease:
        values.daysFishedWithMandatoryRelease ??
        activity.daysFishedWithMandatoryRelease,
      daysFishedOther: values.daysFishedOther ?? activity.daysFishedOther,
      river: values.river ?? activity.river_id
    }

    const riverId = extractRiverId(combinedValues.river)

    if (values.river !== undefined) {
      const riverInternal = await isRiverInternal(riverId)
      validateRiver(values, riverInternal, fmtOrAdmin)
    }

    if (
      values.daysFishedOther !== undefined ||
      values.daysFishedWithMandatoryRelease !== undefined
    ) {
      validateDaysFishedWithMandatoryRelease(combinedValues, submission)
      validateDaysFishedOther(combinedValues, fmtOrAdmin)
    }

    const activityExists = await isActivityExists(
      submission.id,
      riverId,
      activityId
    )

    validateActivityExists(values, activityExists)

    return values
  } catch (err) {
    if (err instanceof JoiExternalValidationError) {
      return helper.message(err.code, err.context)
    }
    throw err
  }
}

const daysFishedWithMandatoryReleaseField = Joi.number()
  .integer()
  .min(0)
  .description('The number of days fished during the mandatory release period')
  .messages({
    'any.required': 'ACTIVITY_DAYS_FISHED_WITH_MANDATORY_RELEASE_REQUIRED',
    'number.min': 'ACTIVITY_DAYS_FISHED_WITH_MANDATORY_RELEASE_NEGATIVE',
    'number.base': 'ACTIVITY_DAYS_FISHED_WITH_MANDATORY_RELEASE_NOT_A_NUMBER',
    'number.integer': 'ACTIVITY_DAYS_FISHED_WITH_MANDATORY_NOT_AN_INTEGER'
  })

const daysFishedOtherField = Joi.number()
  .integer()
  .min(0)
  .max(198)
  .required()
  .description('The number of days fished at other times during the season')
  .messages({
    'any.required': 'ACTIVITY_DAYS_FISHED_OTHER_REQUIRED',
    'number.min': 'ACTIVITY_DAYS_FISHED_OTHER_NEGATIVE',
    'number.max': 'ACTIVITY_DAYS_FISHED_OTHER_MAX_EXCEEDED',
    'number.base': 'ACTIVITY_DAYS_FISHED_OTHER_NOT_A_NUMBER',
    'number.integer': 'ACTIVITY_DAYS_FISHED_OTHER_NOT_AN_INTEGER'
  })

const riverField = Joi.string()
  .pattern(/^rivers\//)
  .description('The river id prefixed with rivers/')
  .messages({
    'any.required': 'ACTIVITY_RIVER_REQUIRED',
    'string.empty': 'ACTIVITY_RIVER_REQUIRED',
    'string.pattern.base': 'ACTIVITY_RIVER_PATTERN_INVALID'
  })

export const createActivitySchema = Joi.object({
  submission: Joi.string()
    .required()
    .pattern(/^submissions\//)
    .description('The submission id prefixed with submissions/')
    .messages({
      'any.required': 'ACTIVITY_SUBMISSION_REQUIRED',
      'string.empty': 'ACTIVITY_SUBMISSION_REQUIRED',
      'string.pattern.base': 'ACTIVITY_SUBMISSION_PATTERN_INVALID'
    }),
  daysFishedWithMandatoryRelease:
    daysFishedWithMandatoryReleaseField.required(),
  daysFishedOther: daysFishedOtherField.required(),
  river: riverField.required()
}).external(validateActivityAsync)

export const updateActivitySchema = Joi.object({
  daysFishedWithMandatoryRelease:
    daysFishedWithMandatoryReleaseField.optional(),
  daysFishedOther: daysFishedOtherField.optional(),
  river: riverField.optional()
})
  .external(validateUpdateActivityAsync)
  .unknown()

export const activityIdSchema = Joi.object({
  activityId: Joi.number().required().description('The id of the activity')
})
