import {
  getSubmission,
  isSubmissionExists
} from '../services/submissions.service.js'
import Joi from 'joi'
import { isActivityExists } from '../services/activities.service.js'
import { isRiverInternal } from '../services/rivers.service.js'

const validateDaysFished = async (value, helper, submissionId) => {
  const submission = await getSubmission(submissionId)

  if (!submission) {
    return helper.message('The submission does not exist')
  }

  const maxDaysFished = submission.season % 4 === 0 ? 168 : 167

  if (value > maxDaysFished) {
    return helper.message(
      `"daysFishedWithMandatoryRelease" must be less than or equal to ${maxDaysFished}`
    )
  }
  return value
}

const validateSubmission = async (value, helper) => {
  const submissionId = value.replace('submissions/', '')
  const submissionExists = await isSubmissionExists(submissionId)
  return submissionExists
    ? value
    : helper.message('The submission does not exist')
}

const validateRiver = async (value, helper) => {
  const riverId = value.replace('rivers/', '')
  const riverInternal = await isRiverInternal(riverId)
  return riverInternal ? helper.message('This river is restricted') : value
}

export const createActivitySchema = Joi.object({
  submission: Joi.string()
    .required()
    .external(validateSubmission)
    .pattern(/^submissions\//)
    .description('The submission id prefixed with submissions/'),

  daysFishedWithMandatoryRelease: Joi.number()
    .integer()
    .required()
    .min(1)
    .external((value, helper) => {
      const submissionId = helper.state.ancestors[0].submission.replace(
        'submissions/',
        ''
      )
      return validateDaysFished(value, helper, submissionId)
    })
    .description(
      'The number of days fished during the mandatory release period'
    ),

  daysFishedOther: Joi.number()
    .integer()
    .min(0)
    .max(198)
    .required()
    .description('The number of days fished at other times during the season'),

  river: Joi.string()
    .required()
    .external(validateRiver)
    .pattern(/^rivers\//)
    .description('The submission id prefixed with rivers/')
}).external(async (value, helper) => {
  const submissionId = value.submission.replace('submissions/', '')
  const riverId = value.river.replace('rivers/', '')

  const activityExists = await isActivityExists(submissionId, riverId)

  if (activityExists) {
    return helper.message('River duplicate found', {
      path: 'river',
      value: value.river
    })
  }
  return value
})
