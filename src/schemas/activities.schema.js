import Joi from 'joi'

export const createActivitySchema = Joi.object({
  submission: Joi.string()
    .required()
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
    .pattern(/^rivers\//)
    .description('The submission id prefixed with rivers/')
})
