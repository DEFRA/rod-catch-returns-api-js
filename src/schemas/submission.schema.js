import { SOURCES, STATUSES } from '../utils/constants.js'
import Joi from 'joi'

export const createSubmissionSchema = Joi.object({
  contactId: Joi.string()
    .required()
    .description('The contact identifier')
    .messages({
      'any.required': 'SUBMISSION_CONTACT_ID_REQUIRED',
      'string.empty': 'SUBMISSION_CONTACT_ID_REQUIRED',
      'string.base': 'SUBMISSION_CONTACT_ID_INVALID'
    }),
  season: Joi.number()
    .required()
    .custom((value, helper) => {
      const currentYear = new Date().getFullYear()
      if (value > currentYear) {
        return helper.message('SUBMISSION_SEASON_INVALID')
      }

      return value
    })
    .description('The season (year) pertaining to the submission')
    .messages({
      'any.required': 'SUBMISSION_SEASON_REQUIRED',
      'string.empty': 'SUBMISSION_SEASON_REQUIRED',
      'number.base': 'SUBMISSION_SEASON_INVALID'
    }),
  status: Joi.string()
    .required()
    .valid(...Object.values(STATUSES))
    .description('The submission status')
    .messages({
      'any.required': 'SUBMISSION_STATUS_REQUIRED',
      'string.empty': 'SUBMISSION_STATUS_REQUIRED'
    }),
  source: Joi.string()
    .required()
    .valid(...Object.values(SOURCES))
    .description('The submission source')
    .messages({
      'any.required': 'SUBMISSION_SOURCE_REQUIRED',
      'string.empty': 'SUBMISSION_SOURCE_REQUIRED'
    }),
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

export const getSubmissionsByContactSchema = Joi.object({
  contact_id: Joi.string().required().description('The contact identifier')
})

export const getBySubmissionIdSchema = Joi.object({
  submissionId: Joi.number().required().description('The id of the submissions')
})
