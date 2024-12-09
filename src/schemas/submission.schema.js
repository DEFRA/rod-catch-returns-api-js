import { SOURCES, STATUSES } from '../utils/constants.js'
import Joi from 'joi'

// TODO clean this up with correct error messages
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
    .valid(...Object.values(STATUSES))
    .description('The submission status'),
  source: Joi.string()
    .required()
    .valid(...Object.values(SOURCES))
    .description('The submission source'),
  reportingExclude: Joi.boolean()
    .optional()
    .description(
      'Indicates if the submission should be excluded from reporting'
    )
})

export const updateSubmissionSchema = Joi.object({
  status: createSubmissionSchema.extract('status').optional(),
  reportingExclude: createSubmissionSchema.extract('reportingExclude')
}).unknown()

export const getSubmissionByContactAndSeasonSchema = Joi.object({
  contact_id: Joi.string().required().description('The contact identifier'),
  season: Joi.number()
    .required()
    .description('The season (year) pertaining to the submission')
})

export const getBySubmissionIdSchema = Joi.object({
  submissionId: Joi.number().required().description('The id of the submissions')
})
