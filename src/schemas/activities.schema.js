import { extractRiverId, extractSubmissionId } from '../utils/entity-utils.js'
import {
  getSubmission,
  isSubmissionExists
} from '../services/submissions.service.js'
import Joi from 'joi'
import { isActivityExists } from '../services/activities.service.js'
import { isRiverInternal } from '../services/rivers.service.js'

const validateDaysFished = (daysFishedOther, helper) => {
  const daysFishedWithMandatoryRelease =
    helper.state.ancestors[0].daysFishedWithMandatoryRelease

  if (daysFishedOther < 1 && daysFishedWithMandatoryRelease < 1) {
    return helper.message('ACTIVITY_DAYS_FISHED_NOT_GREATER_THAN_ZERO')
  }
}

const validateDaysFishedWithMandatoryRelease = async (
  value,
  helper,
  submissionId
) => {
  const submission = await getSubmission(submissionId)

  if (!submission) {
    return helper.message('ACTIVITY_SUBMISSION_NOT_FOUND')
  }

  const maxDaysFished = submission.season % 4 === 0 ? 168 : 167

  if (value > maxDaysFished) {
    return helper.message(
      'ACTIVITY_DAYS_FISHED_WITH_MANDATORY_RELEASE_MAX_EXCEEDED'
    )
  }
  return value
}

const validateSubmission = async (value, helper) => {
  const submissionId = extractSubmissionId(value)
  const submissionExists = await isSubmissionExists(submissionId)
  return submissionExists
    ? value
    : helper.message('ACTIVITY_SUBMISSION_NOT_FOUND')
}

const validateRiver = async (value, helper) => {
  const riverId = extractRiverId(value)
  const riverInternal = await isRiverInternal(riverId)
  return riverInternal ? helper.message('ACTIVITY_RIVER_FORBIDDEN') : value
}

export const createActivitySchema = Joi.object({
  submission: Joi.string()
    .required()
    .external(validateSubmission)
    .pattern(/^submissions\//)
    .description('The submission id prefixed with submissions/')
    .messages({
      'any.required': 'ACTIVITY_SUBMISSION_REQUIRED',
      'string.empty': 'ACTIVITY_SUBMISSION_REQUIRED',
      'string.pattern.base': 'ACTIVITY_SUBMISSION_PATTERN_INVALID'
    }),

  daysFishedWithMandatoryRelease: Joi.number()
    .integer()
    .min(0)
    .required()
    .external((value, helper) => {
      const submissionId = extractSubmissionId(
        helper.state.ancestors[0].submission
      )
      return validateDaysFishedWithMandatoryRelease(value, helper, submissionId)
    })
    .description(
      'The number of days fished during the mandatory release period'
    )
    .messages({
      'any.required': 'ACTIVITY_DAYS_FISHED_WITH_MANDATORY_RELEASE_REQUIRED',
      'number.min': 'ACTIVITY_DAYS_FISHED_WITH_MANDATORY_RELEASE_NEGATIVE',
      'number.base': 'ACTIVITY_DAYS_FISHED_WITH_MANDATORY_RELEASE_NOT_A_NUMBER',
      'number.integer': 'ACTIVITY_DAYS_FISHED_WITH_MANDATORY_NOT_AN_INTEGER'
    }),

  daysFishedOther: Joi.number()
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
    .external(validateDaysFished),

  river: Joi.string()
    .required()
    .external(validateRiver)
    .pattern(/^rivers\//)
    .description('The river id prefixed with rivers/')
    .messages({
      'any.required': 'ACTIVITY_RIVER_REQUIRED',
      'string.empty': 'ACTIVITY_RIVER_REQUIRED',
      'string.pattern.base': 'ACTIVITY_RIVER_PATTERN_INVALID'
    })
    .external(async (value, helper) => {
      const submissionId = extractSubmissionId(
        helper.state.ancestors[0].submission
      )
      const riverId = extractRiverId(value)

      const activityExists = await isActivityExists(submissionId, riverId)

      if (activityExists) {
        return helper.message('ACTIVITY_RIVER_DUPLICATE_FOUND')
      }
      return value
    })
})
