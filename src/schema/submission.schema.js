import Joi from 'joi'

// TODO season must not be in the future, check others too
export const createSubmissionSchema = Joi.object({
  contactId: Joi.string().description('The contact identifier'),
  season: Joi.number().description(
    'The season (year) pertaining to the submission'
  ),
  status: Joi.string()
    .valid('INCOMPLETE', 'SUBMITTED')
    .description('The submission status'),
  source: Joi.string()
    .valid('WEB', 'PAPER')
    .description('The submission source')
})
