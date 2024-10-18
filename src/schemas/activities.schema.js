import Joi from 'joi'

export const createActivitySchema = Joi.object({
  submission: Joi.string()
    .required()
    .description('The submission id prefixed with submissions/'),
  daysFishedWithMandatoryRelease: Joi.number()
    .required()
    .description(
      'The number of days fished during the mandatory release period'
    ),
  daysFishedOther: Joi.number()
    .required()
    .description('The number of days fished at other times during the season'),
  river: Joi.string()
    .required()
    .description('The submission id prefixed with rivers/')
})
