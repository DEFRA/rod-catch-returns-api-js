import Joi from 'joi'

const currentYear = new Date().getFullYear()

export const createSubmissionSchema = Joi.object({
  contactId: Joi.string().description('The contact identifier'),
  season: Joi.number()
    .max(currentYear)
    .description('The season (year) pertaining to the submission')
    .messages({
      'number.max': `Season must not be later than the current year (${currentYear}).`
    }),
  status: Joi.string()
    .valid('INCOMPLETE', 'SUBMITTED')
    .description('The submission status'),
  source: Joi.string()
    .valid('WEB', 'PAPER')
    .description('The submission source')
})
