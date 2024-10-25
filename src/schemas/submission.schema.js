import Joi from 'joi'

const currentYear = new Date().getFullYear()

export const createSubmissionSchema = Joi.object({
  contactId: Joi.string().required().description('The contact identifier'),
  season: Joi.number()
    .required()
    .max(currentYear)
    .description('The season (year) pertaining to the submission')
    .messages({
      'number.max': `Season must not be later than the current year (${currentYear}).`
    }),
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
