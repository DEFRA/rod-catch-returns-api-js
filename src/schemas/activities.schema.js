import Joi from 'joi'
import { checkSubmissionExistsById } from '../services/submissions.service.js'
import { isRiverInternal } from '../services/rivers.service.js'

export const createActivitySchema = Joi.object({
  submission: Joi.string()
    .required()
    .external(async (value, helper) => {
      const submissionId = value.replace('submissions/', '')
      const submissionExists = await checkSubmissionExistsById(submissionId)
      if (!submissionExists) {
        return helper.message('The submission does not exist')
      }
      return value
    })
    .pattern(/^submissions\//)
    .description('The submission id prefixed with submissions/'),
  daysFishedWithMandatoryRelease: Joi.number()
    .required()
    .min(0)
    .custom((value, helper) => {
      const currentYear = new Date().getFullYear()
      const maxDaysFished = currentYear % 4 === 0 ? 168 : 167
      if (value > maxDaysFished) {
        return helper.message(
          `"daysFishedWithMandatoryRelease" must be less than or equal to ${maxDaysFished}`
        )
      }
      return value
    })
    .description(
      'The number of days fished during the mandatory release period'
    ),
  daysFishedOther: Joi.number()
    .min(0)
    .max(198)
    .required()
    .description('The number of days fished at other times during the season'),
  river: Joi.string()
    .required()
    .external(async (value, helper) => {
      const riverId = value.replace('rivers/', '')
      const riverInternal = await isRiverInternal(riverId)

      if (riverInternal) {
        return helper.message('This river is restricted')
      }
      return value
    })
    .pattern(/^rivers\//)
    .description('The submission id prefixed with rivers/')
})
