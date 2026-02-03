import {
  extractActivityId,
  extractMethodId,
  extractSpeciesId
} from '../utils/entity-utils.js'
import Joi from 'joi'
import { JoiExternalValidationError } from '../models/joi-external-validation-error.model.js'
import { MEASURES } from '../utils/constants.js'
import { convertKgtoOz } from '../utils/mass-utils.js'
import { getCatchById } from '../services/catches.service.js'
import { getSubmissionByActivityId } from '../services/activities.service.js'
import { getSubmissionByCatchId } from '../services/submissions.service.js'
import { isFMTOrAdmin } from '../utils/auth-utils.js'
import { isMethodInternal } from '../services/methods.service.js'
import { isSpeciesExists } from '../services/species.service.js'
import logger from '../utils/logger-utils.js'

const MAX_FISH_MASS_KG = 50 // Maximum possible mass of a salmon/sea trout (world record is about 48kg)
const MAX_FISH_MASS_OZ = convertKgtoOz(MAX_FISH_MASS_KG) // 1763.698097oz
const MIN_FISH_MASS = 0

const validateMethod = (values, methodInternal, fmtOrAdmin) => {
  if (!fmtOrAdmin && methodInternal) {
    throw new JoiExternalValidationError('CATCH_METHOD_FORBIDDEN', {
      property: 'method',
      value: values.method
    })
  }
}

const validateSpecies = (values, speciesExists) => {
  if (!speciesExists) {
    throw new JoiExternalValidationError('CATCH_SPECIES_REQUIRED', {
      property: 'species',
      value: values.species
    })
  }
}

const validateDateCaughtYear = (values, season) => {
  const parsedDate = new Date(values.dateCaught)
  const currentDate = new Date()

  if (parsedDate > currentDate) {
    throw new JoiExternalValidationError('CATCH_DATE_IN_FUTURE', {
      property: 'dateCaught',
      value: values.dateCaught
    })
  }

  const yearCaught = parsedDate.getFullYear()
  if (season !== yearCaught) {
    throw new JoiExternalValidationError('CATCH_YEAR_MISMATCH', {
      property: 'dateCaught',
      value: values.dateCaught
    })
  }
}

const validateDateCaughtRequired = (values) => {
  if (!values.dateCaught) {
    if (values.noDateRecorded || values.onlyMonthRecorded) {
      throw new JoiExternalValidationError('CATCH_DEFAULT_DATE_REQUIRED', {
        property: 'dateCaught',
        value: values.dateCaught
      })
    } else {
      throw new JoiExternalValidationError('CATCH_DATE_REQUIRED', {
        property: 'dateCaught',
        value: values.dateCaught
      })
    }
  }
}

const checkDefaultFlagConflict = (values) => {
  if (values.onlyMonthRecorded && values.noDateRecorded) {
    throw new JoiExternalValidationError(
      'CATCH_NO_DATE_RECORDED_WITH_ONLY_MONTH_RECORDED',
      {
        property: 'dateCaught',
        value: values.dateCaught
      }
    )
  }
}

const unwrap = (result) => {
  if (result.status === 'rejected') {
    throw result.reason
  }
  return result.value
}

export const validateCreateCatchAsync = async (values, helper) => {
  try {
    const activityId = extractActivityId(values.activity)
    const speciesId = extractSpeciesId(values.species)
    const methodId = extractMethodId(values.method)
    const fmtOrAdmin = isFMTOrAdmin(helper?.prefs?.context?.auth?.role)

    const results = await Promise.allSettled([
      getSubmissionByActivityId(activityId),
      isSpeciesExists(speciesId),
      isMethodInternal(methodId)
    ])

    const [submission, speciesExists, methodInternal] = results.map(unwrap)

    checkDefaultFlagConflict(values)
    validateDateCaughtRequired(values)
    validateDateCaughtYear(values, submission?.season)
    validateSpecies(values, speciesExists)
    validateMethod(values, methodInternal, fmtOrAdmin)
  } catch (err) {
    if (err instanceof JoiExternalValidationError) {
      if (err.code === 'CATCH_YEAR_MISMATCH') {
        logger.error(err)
      }
      return helper.message(err.code, err.context)
    }
    throw err
  }
}

// TODO add jsdoc
export const validateUpdateCatchAsync = async (values, helper) => {
  try {
    const catchId = helper.prefs.context.params.catchId
    const fmtOrAdmin = isFMTOrAdmin(helper?.prefs?.context?.auth?.role)
    const foundCatch = await getCatchById(catchId)

    const combinedValues = {
      noDateRecorded: values.noDateRecorded ?? foundCatch.noDateRecorded,
      onlyMonthRecorded:
        values.onlyMonthRecorded ?? foundCatch.onlyMonthRecorded,
      dateCaught: values.dateCaught ?? foundCatch.dateCaught
    }
    const submission = await getSubmissionByCatchId(catchId)

    checkDefaultFlagConflict(combinedValues)
    validateDateCaughtRequired(combinedValues)
    validateDateCaughtYear(combinedValues, submission.season)

    if (values.species) {
      const speciesId = extractSpeciesId(values.species)
      const speciesExists = await isSpeciesExists(speciesId)
      validateSpecies(values, speciesExists)
    }

    if (values.method) {
      const methodId = extractMethodId(values.method)
      const methodInternal = await isMethodInternal(methodId)
      validateMethod(values, methodInternal, fmtOrAdmin)
    }
  } catch (err) {
    if (err instanceof JoiExternalValidationError) {
      if (err.code === 'CATCH_YEAR_MISMATCH') {
        logger.error(err)
      }
      return helper.message(err.code, err.context)
    }
    throw err
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
    .pattern(/^activities\//)
    .messages({
      'any.required': 'CATCH_ACTIVITY_REQUIRED',
      'string.pattern.base': 'CATCH_ACTIVITY_INVALID'
    })
    .description('The activity associated with this catch'),
  dateCaught: dateCaughtField.messages({
    'string.base': 'CATCH_DATE_REQUIRED'
  }),
  onlyMonthRecorded: onlyMonthRecordedField,
  noDateRecorded: noDateRecordedField,
  species: speciesField.required(),
  mass: massField.required(),
  method: methodField.required(),
  released: releasedField.required(),
  reportingExclude: reportingExcludeField.default(false)
})
  .external(validateCreateCatchAsync)
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
  .external(validateUpdateCatchAsync)
  .unknown()

export const catchIdSchema = Joi.object({
  catchId: Joi.number().required().description('The id of the catch')
})

export const updateCatchActivityIdSchema = Joi.string()
  .required()
  .pattern(/^activities\/\d+$/)
  .messages({
    'any.required': 'CATCH_ACTIVITY_REQUIRED',
    'string.pattern.base': 'CATCH_ACTIVITY_INVALID'
  })
  .description('The activity associated with this catch')
