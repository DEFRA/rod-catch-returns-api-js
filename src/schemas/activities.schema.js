import { extractRiverId, extractSubmissionId } from '../utils/entity-utils.js'
import {
  getSubmission,
  isSubmissionExistsById
} from '../services/submissions.service.js'
import {
  getSubmissionByActivityId,
  isActivityExists
} from '../services/activities.service.js'
import Joi from 'joi'
import { isFMTOrAdmin } from '../utils/auth-utils.js'
import { isLeapYear } from '../utils/date-utils.js'
import { isRiverInternals } from '../services/rivers.service.js'
import logger from '../utils/logger-utils.js'

const MAX_DAYS_LEAP_YEAR = 168
const MAX_DAYS_NON_LEAP_YEAR = 167

class ActivityValidationError extends Error {
  constructor(code) {
    super(code)
    this.code = code
  }
}

async function validateAllDaysFished(values, submission, ctx, helper) {
  const fmtOrAdmin = isFMTOrAdmin(ctx?.auth?.role)

  const other = values.daysFishedOther
  const withRelease = values.daysFishedWithMandatoryRelease

  if (
    !fmtOrAdmin &&
    other !== undefined &&
    withRelease !== undefined &&
    other < 1 &&
    withRelease < 1
  ) {
    throw new ActivityValidationError(
      'ACTIVITY_DAYS_FISHED_NOT_GREATER_THAN_ZERO'
    )
  }

  if (withRelease !== undefined) {
    const maxDays = isLeapYear(submission.season)
      ? MAX_DAYS_LEAP_YEAR
      : MAX_DAYS_NON_LEAP_YEAR

    if (withRelease > maxDays) {
      throw new ActivityValidationError(
        'ACTIVITY_DAYS_FISHED_WITH_MANDATORY_RELEASE_MAX_EXCEEDED'
      )
    }
  }
}

const validateAllRivers = async (values, submission, ctx, activityId) => {
  if (values.river === undefined) return

  try {
    const riverId = extractRiverId(values.river)
    const riverInternal = await isRiverInternals(riverId, ctx.cache)
    const fmtOrAdmin = isFMTOrAdmin(ctx?.auth?.role)

    if (riverInternal && !fmtOrAdmin) {
      throw new ActivityValidationError('ACTIVITY_RIVER_FORBIDDEN')
    }

    const exists = await isActivityExists(submission.id, riverId, activityId)

    if (exists) {
      throw new ActivityValidationError('ACTIVITY_RIVER_DUPLICATE_FOUND')
    }
  } catch (error) {
    if (error.message === 'RIVER_NOT_FOUND') {
      throw new ActivityValidationError('ACTIVITY_RIVER_NOT_FOUND')
    }
    throw error
  }
}

async function validateAllSubmissions(values, helper) {
  const submissionId = extractSubmissionId(values.submission)

  const exists = await isSubmissionExistsById(submissionId)
  if (!exists) {
    throw new ActivityValidationError('ACTIVITY_SUBMISSION_NOT_FOUND')
  }

  return getSubmission(submissionId)
}

const validateDaysFished = (daysFishedOther, helper) => {
  const fmtOrAdmin = isFMTOrAdmin(helper?.prefs?.context?.auth?.role)

  const daysFishedWithMandatoryRelease =
    helper.state.ancestors[0].daysFishedWithMandatoryRelease

  if (
    !fmtOrAdmin &&
    daysFishedOther < 1 &&
    daysFishedWithMandatoryRelease < 1
  ) {
    return helper.message('ACTIVITY_DAYS_FISHED_NOT_GREATER_THAN_ZERO')
  }

  return daysFishedOther
}

const validateDaysFishedWithMandatoryRelease = async (
  value,
  helper,
  submission
) => {
  if (!submission) {
    return helper.message('ACTIVITY_SUBMISSION_NOT_FOUND')
  }

  const maxDaysFished = isLeapYear(submission.season)
    ? MAX_DAYS_LEAP_YEAR
    : MAX_DAYS_NON_LEAP_YEAR

  if (value > maxDaysFished) {
    return helper.message(
      'ACTIVITY_DAYS_FISHED_WITH_MANDATORY_RELEASE_MAX_EXCEEDED'
    )
  }
  return value
}

const validateSubmission = async (value, helper) => {
  const submissionId = extractSubmissionId(value)
  const submissionExists = await isSubmissionExistsById(submissionId)
  return submissionExists
    ? value
    : helper.message('ACTIVITY_SUBMISSION_NOT_FOUND')
}

const validateRiver = async (value, helper) => {
  try {
    const riverId = extractRiverId(value)
    const riverInternal = await isRiverInternals(riverId)
    const fmtOrAdmin = isFMTOrAdmin(helper?.prefs?.context?.auth?.role)

    if (riverInternal && !fmtOrAdmin) {
      return helper.message('ACTIVITY_RIVER_FORBIDDEN')
    }

    return value
  } catch (error) {
    // Handle the case where the river does not exist
    if (error.message === 'RIVER_NOT_FOUND') {
      return helper.message('ACTIVITY_RIVER_NOT_FOUND')
    }

    // Re-throw unexpected errors
    throw error
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
  .external(validateDaysFished)

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
}).external(async (values, helper) => {
  try {
    const ctx = helper?.prefs?.context

    const submission = await validateAllSubmissions(values)
    await validateAllDaysFished(values, submission, ctx)
    await validateAllRivers(values, submission, ctx, null)

    return values
  } catch (error) {
    if (error instanceof ActivityValidationError) {
      return helper.message(error.code)
    }
    throw error
  }
})

export const updateActivitySchema = Joi.object({
  daysFishedWithMandatoryRelease:
    daysFishedWithMandatoryReleaseField.optional(),
  daysFishedOther: daysFishedOtherField.optional(),
  river: riverField.optional()
})
  .external(async (values, helper) => {
    try {
      const ctx = helper?.prefs?.context
      const activityId = ctx.params.activityId

      const submission = await getSubmissionByActivityId(activityId)

      if (!submission) {
        throw new ActivityValidationError('ACTIVITY_SUBMISSION_NOT_FOUND')
      }

      await validateAllDaysFished(values, submission, ctx)

      await validateAllRivers(values, submission, ctx, activityId)

      return values
    } catch (error) {
      if (error instanceof ActivityValidationError) {
        return helper.message(error.code)
      }
      logger.error(error)
      throw error
    }
  })
  .unknown()

export const activityIdSchema = Joi.object({
  activityId: Joi.number().required().description('The id of the activity')
})
