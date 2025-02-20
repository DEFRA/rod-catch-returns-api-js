import { SOURCES, STATUSES } from '../utils/constants.js'
import Joi from 'joi'

const contactIdSchema = Joi.string()
  .required()
  .description('The contact identifier')
  .messages({
    'any.required': 'SUBMISSION_CONTACT_ID_REQUIRED',
    'string.empty': 'SUBMISSION_CONTACT_ID_REQUIRED',
    'string.base': 'SUBMISSION_CONTACT_ID_INVALID'
  })

const seasonSchema = Joi.number()
  .required()
  .custom((value, helper) => {
    if (value > new Date().getFullYear()) {
      return helper.message('SUBMISSION_SEASON_INVALID')
    }
    return value
  })
  .description('The season (year) pertaining to the submission')
  .messages({
    'any.required': 'SUBMISSION_SEASON_REQUIRED',
    'string.empty': 'SUBMISSION_SEASON_REQUIRED',
    'number.base': 'SUBMISSION_SEASON_INVALID'
  })

const statusSchema = Joi.string()
  .valid(...Object.values(STATUSES))
  .description('The submission status')
  .messages({
    'any.required': 'SUBMISSION_STATUS_REQUIRED',
    'string.empty': 'SUBMISSION_STATUS_REQUIRED'
  })

const sourceSchema = Joi.string()
  .required()
  .valid(...Object.values(SOURCES))
  .description('The submission source')
  .messages({
    'any.required': 'SUBMISSION_SOURCE_REQUIRED',
    'string.empty': 'SUBMISSION_SOURCE_REQUIRED'
  })

const reportingExcludeSchema = Joi.boolean()
  .optional()
  .description('Indicates if the submission should be excluded from reporting')

export const createSubmissionSchema = Joi.object({
  contactId: contactIdSchema,
  season: seasonSchema,
  status: statusSchema.required(),
  source: sourceSchema,
  reportingExclude: reportingExcludeSchema
})

export const updateSubmissionSchema = Joi.object({
  status: statusSchema.optional(),
  reportingExclude: reportingExcludeSchema
}).unknown()

export const getSubmissionByContactAndSeasonSchema = Joi.object({
  contact_id: contactIdSchema,
  season: seasonSchema
})

export const getSubmissionsByContactSchema = Joi.object({
  contact_id: contactIdSchema
})

export const getBySubmissionIdSchema = Joi.object({
  submissionId: Joi.number().required().description('The id of the submission')
})
