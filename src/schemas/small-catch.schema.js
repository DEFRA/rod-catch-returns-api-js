import {
  extractActivityId,
  extractMethodId,
  sumCounts
} from '../utils/entity-utils.js'
import {
  getSmallCatchById,
  getTotalSmallCatchCountsBySmallCatchId,
  isDuplicateSmallCatch
} from '../services/small-catch.service.js'
import { isAfter, set } from 'date-fns'
import Joi from 'joi'
import { getMonthNumberFromName } from '../utils/date-utils.js'
import { getSubmissionByActivityId } from '../services/activities.service.js'
import { isMethodsInternal } from '../services/methods.service.js'
import logger from '../utils/logger-utils.js'

const validateUniqueActivityAndMonth = async (
  monthName,
  activityId,
  ignoreMonth
) => {
  const month = getMonthNumberFromName(monthName)
  const duplicateExists = await isDuplicateSmallCatch(
    activityId,
    month,
    ignoreMonth
  )
  if (duplicateExists) {
    throw new Error('SMALL_CATCH_DUPLICATE_FOUND')
  }
}

const validateMonthInFuture = (monthName, season) => {
  const currentYearAndMonth = set(new Date(), {
    date: 1,
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0
  }) // Reset to the start of the first day of the current month

  const inputMonth = getMonthNumberFromName(monthName) // Month is not one-based in our app
  const inputDate = new Date(season, inputMonth - 1) // Month is zero-based in js Date

  if (isAfter(inputDate, currentYearAndMonth)) {
    throw new Error('SMALL_CATCH_MONTH_IN_FUTURE')
  }
}

const validateCounts = async (value, helper) => {
  const methods = value.map((item) => item.method)
  const hasDuplicates = new Set(methods).size !== methods.length
  if (hasDuplicates) {
    return helper.message('SMALL_CATCH_COUNTS_METHOD_DUPLICATE_FOUND')
  }

  const methodIds = methods.map((method) => extractMethodId(method))

  const methodInternal = await isMethodsInternal(methodIds)
  if (methodInternal) {
    return helper.message('SMALL_CATCH_COUNTS_METHOD_FORBIDDEN')
  }

  return value
}

const monthField = Joi.string().description('The month this record relates to')

const countsField = Joi.array()
  .items(
    Joi.object({
      method: Joi.string().required().messages({
        'any.required': 'SMALL_CATCH_COUNTS_METHOD_REQUIRED'
      }),
      count: Joi.number().integer().min(0).required().messages({
        'any.required': 'SMALL_CATCH_COUNTS_COUNT_REQUIRED',
        'number.base': 'SMALL_CATCH_COUNTS_COUNT_NUMBER',
        'number.integer': 'SMALL_CATCH_COUNTS_COUNT_INTEGER',
        'number.min': 'SMALL_CATCH_COUNTS_NOT_GREATER_THAN_ZERO'
      })
    })
  )
  .min(1)
  .messages({
    'any.required': 'SMALL_CATCH_COUNTS_REQUIRED',
    'array.base': 'SMALL_CATCH_COUNTS_REQUIRED',
    'array.min': 'SMALL_CATCH_COUNTS_REQUIRED'
  })
  .description('Small catches counts')

const releasedField = Joi.number().integer().min(0).messages({
  'any.required': 'SMALL_CATCH_RELEASED_REQUIRED',
  'number.base': 'SMALL_CATCH_RELEASED_NUMBER',
  'number.integer': 'SMALL_CATCH_RELEASED_INTEGER',
  'number.min': 'SMALL_CATCH_RELEASED_NEGATIVE'
})

const noMonthRecordedField = Joi.boolean()
  .messages({
    'boolean.base': 'SMALL_CATCH_NO_MONTH_RECORDED_INVALID'
  })
  .description('To allow FMT users to report on the default date')

const reportingExcludeField = Joi.boolean()
  .messages({
    'boolean.base': 'SMALL_CATCH_REPORTING_EXCLUDE_INVALID'
  })
  .description('Is this entry excluded from reporting')

export const createSmallCatchSchema = Joi.object({
  activity: Joi.string().required().messages({
    'any.required': 'SMALL_CATCH_ACTIVITY_REQUIRED'
  }),
  month: monthField
    .required()
    .when('noMonthRecorded', {
      is: true,
      then: Joi.required().messages({
        'any.required': 'SMALL_CATCH_DEFAULT_MONTH_REQUIRED',
        'string.base': 'SMALL_CATCH_DEFAULT_MONTH_REQUIRED'
      }),
      otherwise: Joi.required().messages({
        'any.required': 'SMALL_CATCH_MONTH_REQUIRED',
        'string.base': 'SMALL_CATCH_MONTH_REQUIRED'
      })
    })
    .external(async (value, helper) => {
      const activityId = extractActivityId(helper.state.ancestors[0].activity)
      const submission = await getSubmissionByActivityId(activityId)

      try {
        await validateUniqueActivityAndMonth(value, activityId)
        validateMonthInFuture(value, submission.season)
      } catch (error) {
        logger.error(error)
        return helper.message(error.message)
      }
      return value
    }),
  counts: countsField.required().external((value, helper) => {
    return validateCounts(value, helper)
  }),
  released: releasedField.required().custom((value, helper) => {
    const countsArray = helper.state.ancestors[0].counts
    const totalCaught = sumCounts(countsArray)

    if (value > totalCaught) {
      return helper.message('SMALL_CATCH_RELEASED_EXCEEDS_COUNTS')
    }

    return value
  }),
  noMonthRecorded: noMonthRecordedField,
  reportingExclude: reportingExcludeField
}).unknown()

export const updateSmallCatchSchema = Joi.object({
  month: monthField.optional().external(async (value, helper) => {
    // Skip validation if the field is undefined (Joi runs external validation, even if the field is not supplied)
    if (value === undefined) {
      return value
    }
    // Get catchId from the request context
    const smallCatchId = helper.prefs.context.params.smallCatchId
    const smallCatch = await getSmallCatchById(smallCatchId)
    const submission = await getSubmissionByActivityId(smallCatch.activity_id)

    try {
      await validateUniqueActivityAndMonth(
        value,
        smallCatch.activity_id,
        smallCatch.month
      )
      validateMonthInFuture(value, submission.season)
    } catch (error) {
      logger.error(error)
      return helper.message(error.message)
    }

    return value
  }),
  counts: countsField.optional().external((value, helper) => {
    // Skip validation if the field is undefined (Joi runs external validation, even if the field is not supplied)
    if (value === undefined) {
      return value
    }
    return validateCounts(value, helper)
  }),
  released: releasedField.optional().external(async (value, helper) => {
    // We do not want to skip validation as this validates multiple fields
    const smallCatchId = helper.prefs.context.params.smallCatchId
    const foundTotalCaught =
      await getTotalSmallCatchCountsBySmallCatchId(smallCatchId)

    // We make two calls to getSmallCatchById in this schema, there must be a better way to only fetch it once and store it
    const foundSmallCatch = await getSmallCatchById(smallCatchId)

    const releasedValue = value ?? foundSmallCatch.released
    const countsArray = helper.state.ancestors[0]?.counts

    const totalCaught = countsArray ? sumCounts(countsArray) : foundTotalCaught

    if (totalCaught === undefined || releasedValue > totalCaught) {
      return helper.message('SMALL_CATCH_RELEASED_EXCEEDS_COUNTS')
    }

    return value
  }),
  noMonthRecorded: noMonthRecordedField,
  reportingExclude: reportingExcludeField
})

export const smallCatchIdSchema = Joi.object({
  smallCatchId: Joi.number().required().description('The id of the small catch')
})
