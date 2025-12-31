import {
  extractActivityId,
  extractMethodId,
  extractSpeciesId
} from '../utils/entity-utils.js'
import Joi from 'joi'
import { MEASURES } from '../utils/constants.js'
import { convertKgtoOz } from '../utils/mass-utils.js'
import { getCatchById } from '../services/catches.service.js'
import { getSubmissionByActivityId } from '../services/activities.service.js'
import { getSubmissionByCatchId } from '../services/submissions.service.js'
import { isFMTOrAdmin } from '../utils/auth-utils.js'
import { isMethodInternal } from '../services/methods.service.js'
import { isSpeciesExists } from '../services/species.service.js'
import logger from '../utils/logger-utils.js'

const MAX_FISH_MASS_KG = 50
const MAX_FISH_MASS_OZ = convertKgtoOz(MAX_FISH_MASS_KG)
const MIN_FISH_MASS = 0

class CatchValidationError extends Error {
  constructor(code) {
    super(code)
    this.code = code
  }
}

function checkDefaultFlagConflict(onlyMonthRecorded, noDateRecorded) {
  if (onlyMonthRecorded && noDateRecorded) {
    throw new CatchValidationError(
      'CATCH_NO_DATE_RECORDED_WITH_ONLY_MONTH_RECORDED'
    )
  }
}

function validateDateCaughtRequired(
  dateCaught,
  noDateRecorded,
  onlyMonthRecorded
) {
  if (!dateCaught) {
    if (noDateRecorded || onlyMonthRecorded) {
      throw new CatchValidationError('CATCH_DEFAULT_DATE_REQUIRED')
    }
    throw new CatchValidationError('CATCH_DATE_REQUIRED')
  }
}

function validateDateCaughtYear(dateCaught, season) {
  const parsed = new Date(dateCaught)
  const now = new Date()

  if (parsed > now) {
    throw new CatchValidationError('CATCH_DATE_IN_FUTURE')
  }

  if (parsed.getFullYear() !== season) {
    throw new CatchValidationError('CATCH_YEAR_MISMATCH')
  }
}

async function validateCreateDate(values) {
  const activityId = extractActivityId(values.activity)
  const submission = await getSubmissionByActivityId(activityId)

  if (!submission) {
    throw new CatchValidationError('CATCH_ACTIVITY_INVALID')
  }

  checkDefaultFlagConflict(values.onlyMonthRecorded, values.noDateRecorded)
  validateDateCaughtRequired(
    values.dateCaught,
    values.noDateRecorded,
    values.onlyMonthRecorded
  )
  validateDateCaughtYear(values.dateCaught, submission.season)
}

async function validateUpdateDate(values, catchId) {
  const found = await getCatchById(catchId)
  const submission = await getSubmissionByCatchId(catchId)

  const noDateRecorded = values.noDateRecorded ?? found.noDateRecorded
  const onlyMonthRecorded = values.onlyMonthRecorded ?? found.onlyMonthRecorded
  const dateCaught = values.dateCaught ?? found.dateCaught

  checkDefaultFlagConflict(onlyMonthRecorded, noDateRecorded)
  validateDateCaughtRequired(dateCaught, noDateRecorded, onlyMonthRecorded)
  validateDateCaughtYear(dateCaught, submission.season)
}

async function validateSpecies(values) {
  if (values.species === undefined) return

  const speciesId = extractSpeciesId(values.species)
  const exists = await isSpeciesExists(speciesId)

  if (!exists) {
    throw new CatchValidationError('CATCH_SPECIES_REQUIRED')
  }
}

async function validateMethod(values, ctx) {
  if (values.method === undefined) return

  const methodId = extractMethodId(values.method)
  const internal = await isMethodInternal(methodId)
  const fmtOrAdmin = isFMTOrAdmin(ctx?.auth?.role)

  if (internal && !fmtOrAdmin) {
    throw new CatchValidationError('CATCH_METHOD_FORBIDDEN')
  }
}

const dateCaughtField = Joi.string()
  .invalid(null)
  .messages({
    'any.invalid': 'CATCH_DATE_REQUIRED'
  })
  .description('The date of the catch')

const onlyMonthRecordedField = Joi.boolean()
  .messages({
    'any.required': 'CATCH_ONLY_MONTH_RECORDED_REQUIRED',
    'boolean.base': 'CATCH_ONLY_MONTH_RECORDED_REQUIRED'
  })
  .description('To allow FMT users to report on the default dates')

const noDateRecordedField = Joi.boolean()
  .messages({
    'any.required': 'CATCH_NO_DATE_RECORDED_REQUIRED',
    'boolean.base': 'CATCH_NO_DATE_RECORDED_REQUIRED'
  })
  .description('To allow FMT users to report on the default month')

const speciesField = Joi.string()
  .pattern(/^species\//)
  .messages({
    'any.required': 'CATCH_SPECIES_REQUIRED',
    'string.pattern.base': 'CATCH_SPECIES_INVALID'
  })
  .description('The species of catch (Salmon, Sea Trout)')

const massField = Joi.object({
  kg: Joi.when('type', {
    is: MEASURES.METRIC,
    then: Joi.number().required().greater(MIN_FISH_MASS).max(MAX_FISH_MASS_KG)
  })
    .messages({
      'any.required': 'CATCH_MASS_KG_REQUIRED',
      'number.base': 'CATCH_MASS_KG_REQUIRED',
      'number.positive': 'CATCH_MASS_KG_POSITIVE',
      'number.greater': 'CATCH_MASS_BELOW_MINIMUM',
      'number.max': 'CATCH_MASS_MAX_EXCEEDED'
    })
    .description('The mass of the catch in metric kg'),
  oz: Joi.when('type', {
    is: MEASURES.IMPERIAL,
    then: Joi.number().required().greater(MIN_FISH_MASS).max(MAX_FISH_MASS_OZ)
  })
    .messages({
      'any.required': 'CATCH_MASS_OZ_REQUIRED',
      'number.base': 'CATCH_MASS_OZ_REQUIRED',
      'number.positive': 'CATCH_MASS_OZ_POSITIVE',
      'number.greater': 'CATCH_MASS_BELOW_MINIMUM',
      'number.max': 'CATCH_MASS_MAX_EXCEEDED'
    })
    .description('The mass of the catch in imperial ounces'),
  type: Joi.string()
    .valid(...Object.values(MEASURES))
    .required()
    .messages({
      'any.required': 'CATCH_MASS_TYPE_REQUIRED',
      'any.only': 'CATCH_MASS_TYPE_INVALID'
    })
    .description('The type of measurement provided by the end user')
})
  .messages({
    'any.required': 'CATCH_MASS_REQUIRED'
  })
  .description('The mass of the catch')

const methodField = Joi.string()
  .pattern(/^methods\//)
  .description('The method id prefixed with methods/')
  .messages({
    'any.required': 'CATCH_METHOD_REQUIRED',
    'string.pattern.base': 'CATCH_METHOD_INVALID'
  })

const releasedField = Joi.boolean()
  .description('Was the catch released?')
  .messages({
    'any.required': 'CATCH_RELEASED_REQUIRED',
    'boolean.base': 'CATCH_RELEASED_REQUIRED'
  })

const reportingExcludeField = Joi.boolean().description(
  'Is this entry excluded from reporting'
)

export const createCatchSchema = Joi.object({
  activity: Joi.string()
    .required()
    .pattern(/^activities\//),
  dateCaught: dateCaughtField,
  onlyMonthRecorded: onlyMonthRecordedField,
  noDateRecorded: noDateRecordedField,
  species: speciesField.required(),
  mass: massField.required(),
  method: methodField.required(),
  released: releasedField.required(),
  reportingExclude: reportingExcludeField.default(false)
})
  .external(async (values, helper) => {
    try {
      const ctx = helper?.prefs?.context

      await validateCreateDate(values)
      await validateSpecies(values)
      await validateMethod(values, ctx)

      return values
    } catch (error) {
      if (error instanceof CatchValidationError) {
        if (error.code !== 'CATCH_DATE_IN_FUTURE') logger.error(error)
        return helper.message(error.code)
      }
      throw error
    }
  })
  .unknown()

export const updateCatchSchema = Joi.object({
  dateCaught: dateCaughtField.optional(),
  onlyMonthRecorded: onlyMonthRecordedField,
  noDateRecorded: noDateRecordedField,
  species: speciesField.optional(),
  mass: massField.optional(),
  method: methodField.optional(),
  released: releasedField.optional(),
  reportingExclude: reportingExcludeField
})
  .external(async (values, helper) => {
    try {
      const ctx = helper?.prefs?.context
      const catchId = ctx.params.catchId

      await validateUpdateDate(values, catchId)
      await validateSpecies(values)
      await validateMethod(values, ctx)

      return values
    } catch (error) {
      if (error instanceof CatchValidationError) {
        return helper.message(error.code)
      }
      logger.error(error)
      throw error
    }
  })
  .unknown()

export const catchIdSchema = Joi.object({
  catchId: Joi.number().required()
})

export const updateCatchActivityIdSchema = Joi.string()
  .required()
  .pattern(/^activities\/\d+$/)
