import { extractActivityId, extractMethodId } from '../utils/entity-utils.js'
import Joi from 'joi'
import { MEASURES } from '../utils/constants.js'
import { convertKgtoOz } from '../utils/mass-utils.js'
import { getCatchById } from '../services/catches.service.js'
import { getSubmissionByActivityId } from '../services/activities.service.js'
import { getSubmissionByCatchId } from '../services/submissions.service.js'
import { isMethodInternal } from '../services/methods.service.js'
import logger from '../utils/logger-utils.js'

const MAX_FISH_MASS_KG = 50 // Maximum possible mass of a salmon/sea trout (world record is about 48kg)
const MAX_FISH_MASS_OZ = convertKgtoOz(MAX_FISH_MASS_KG) // 1763.698097oz
const MIN_FISH_MASS = 0

const validateMethod = async (value, helper) => {
  const methodId = extractMethodId(value)
  const methodInternal = await isMethodInternal(methodId)
  return methodInternal ? helper.message('CATCH_METHOD_FORBIDDEN') : value
}

const validateDateCaughtYear = (dateCaught, season) => {
  const parsedDate = new Date(dateCaught)
  const currentDate = new Date()

  if (parsedDate > currentDate) {
    throw new Error('CATCH_DATE_IN_FUTURE')
  }

  const yearCaught = parsedDate.getFullYear()
  if (season !== yearCaught) {
    throw new Error('CATCH_YEAR_MISMATCH')
  }
}

const validateDateCaughtRequired = ({
  dateCaught,
  noDateRecorded,
  onlyMonthRecorded
}) => {
  if (!dateCaught) {
    if (noDateRecorded || onlyMonthRecorded) {
      throw new Error('CATCH_DEFAULT_DATE_REQUIRED')
    } else {
      throw new Error('CATCH_DATE_REQUIRED')
    }
  }
}

const checkDefaultFlagConflict = (onlyMonthRecorded, noDateRecorded) => {
  if (onlyMonthRecorded && noDateRecorded) {
    throw new Error('CATCH_NO_DATE_RECORDED_WITH_ONLY_MONTH_RECORDED')
  }
}

const dateCaughtField = Joi.string().description('The date of the catch')

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
    then: Joi.number().required().min(MIN_FISH_MASS).max(MAX_FISH_MASS_KG)
  })
    .messages({
      'any.required': 'CATCH_MASS_KG_REQUIRED',
      'number.base': 'CATCH_MASS_KG_REQUIRED',
      'number.positive': 'CATCH_MASS_KG_POSITIVE',
      'number.min': 'CATCH_MASS_BELOW_MINIMUM',
      'number.max': 'CATCH_MASS_MAX_EXCEEDED'
    })
    .description('The mass of the catch in metric kg'),
  oz: Joi.when('type', {
    is: MEASURES.IMPERIAL,
    then: Joi.number().required().min(MIN_FISH_MASS).max(MAX_FISH_MASS_OZ)
  })
    .messages({
      'any.required': 'CATCH_MASS_OZ_REQUIRED',
      'number.base': 'CATCH_MASS_OZ_REQUIRED',
      'number.positive': 'CATCH_MASS_OZ_POSITIVE',
      'number.min': 'CATCH_MASS_BELOW_MINIMUM',
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
  dateCaught: dateCaughtField.external(async (value, helper) => {
    const activityId = extractActivityId(helper.state.ancestors[0].activity)

    const submission = await getSubmissionByActivityId(activityId)

    const noDateRecorded = helper.state.ancestors[0]?.noDateRecorded
    const onlyMonthRecorded = helper.state.ancestors[0]?.onlyMonthRecorded

    try {
      checkDefaultFlagConflict(onlyMonthRecorded, noDateRecorded)
      validateDateCaughtRequired({
        dateCaught: value,
        noDateRecorded,
        onlyMonthRecorded
      })
      validateDateCaughtYear(value, submission?.season)
    } catch (error) {
      logger.error(error)
      return helper.message(error.message)
    }
    return value
  }),
  onlyMonthRecorded: onlyMonthRecordedField,
  noDateRecorded: noDateRecordedField,
  species: speciesField.required(),
  mass: massField.required(),
  method: methodField.required().external(validateMethod),
  released: releasedField.required(),
  reportingExclude: reportingExcludeField.default(false)
}).unknown()

export const updateCatchSchema = Joi.object({
  dateCaught: dateCaughtField.optional().external(async (value, helper) => {
    // We do not want to skip validation as this validates multiple fields
    // Get catchId from the request context
    const catchId = helper.prefs.context.params.catchId

    // get noDateRecorded and onlyMonthRecorded either from the request or from the database
    const foundCatch = await getCatchById(catchId)
    const noDateRecorded =
      helper.state.ancestors[0]?.noDateRecorded ?? foundCatch.noDateRecorded
    const onlyMonthRecorded =
      helper.state.ancestors[0]?.onlyMonthRecorded ??
      foundCatch.onlyMonthRecorded
    const dateCaught = value ?? foundCatch.dateCaught

    const submission = await getSubmissionByCatchId(catchId)

    try {
      checkDefaultFlagConflict(onlyMonthRecorded, noDateRecorded)
      validateDateCaughtRequired({
        dateCaught,
        noDateRecorded,
        onlyMonthRecorded
      })

      validateDateCaughtYear(dateCaught, submission.season)
    } catch (error) {
      return helper.message(error.message)
    }

    return value
  }),
  onlyMonthRecorded: onlyMonthRecordedField,
  noDateRecorded: noDateRecordedField,
  species: speciesField.optional(),
  mass: massField.optional(),
  method: methodField.optional().external(async (value, helper) => {
    // Skip validation if the field is undefined (Joi runs external validation, even if the field is not supplied)
    if (value === undefined) {
      return value
    }

    return validateMethod(value, helper)
  }),
  released: releasedField.optional(),
  reportingExclude: reportingExcludeField
}).unknown()

export const catchIdSchema = Joi.object({
  catchId: Joi.number().required().description('The id of the catch')
})
