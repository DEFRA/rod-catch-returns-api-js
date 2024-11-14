import Joi from 'joi'

export const createSubmissionSchema = Joi.object({
  contactId: Joi.string().required().description('The contact identifier'),
  season: Joi.number()
    .required()
    .custom((value, helper) => {
      const currentYear = new Date().getFullYear()
      if (value > currentYear) {
        return helper.message(
          `Season must not be later than the current year (${currentYear}).`
        )
      }

      return value
    })
    .description('The season (year) pertaining to the submission'),
  status: Joi.string()
    .required()
    .valid('INCOMPLETE', 'SUBMITTED')
    .description('The submission status'),
  source: Joi.string()
    .required()
    .valid('WEB', 'PAPER')
    .description('The submission source')
})

export const getSubmissionByContactAndSeasonSchema = Joi.object({
  contact_id: Joi.string().required().description('The contact identifier'),
  season: Joi.number()
    .required()
    .description('The season (year) pertaining to the submission')
})

export const getBySubmissionIdSchema = Joi.object({
  submissionId: Joi.number().required().description('The id of the submissions')
})
