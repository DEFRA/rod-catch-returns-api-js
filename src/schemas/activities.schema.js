import Joi from 'joi'

const currentYear = new Date().getFullYear()

export const createActivitySchema = Joi.object({
  submission: Joi.string()
    .required()
    .pattern(/^submissions\//)
    .description('The submission id prefixed with submissions/'),
  daysFishedWithMandatoryRelease: Joi.number()
    .required()
    .min(0)
    .max(currentYear % 4 === 0 ? 168 : 167) // check if leap year
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
