import {
  extractActivityId,
  extractMethodId,
  sumCounts
} from '../utils/entity-utils.js'
import {
  getSmallCatchById,
  getSmallCatchCountsBySmallCatchId,
  isDuplicateSmallCatch
} from '../services/small-catch.service.js'
import { isAfter, set } from 'date-fns'
import Joi from 'joi'
import { JoiExternalValidationError } from '../models/joi-external-validation-error.model.js'
import { getMonthNumberFromName } from '../utils/date-utils.js'
import { getSubmissionByActivityId } from '../services/activities.service.js'
import { isFMTOrAdmin } from '../utils/auth-utils.js'
import { isMethodsInternal } from '../services/methods.service.js'
import logger from '../utils/logger-utils.js'

const validateDuplicateMethods = (values, methods) => {
  const hasDuplicates = new Set(methods).size !== methods.length
  if (hasDuplicates) {
    throw new JoiExternalValidationError(
      'SMALL_CATCH_COUNTS_METHOD_DUPLICATE_FOUND',
      {
        property: 'counts',
        value: values.counts
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

const validateDuplicateSmallCatch = (values, duplicateExists) => {
  if (duplicateExists) {
    throw new JoiExternalValidationError('SMALL_CATCH_DUPLICATE_FOUND', {
      property: 'month',
      value: values.month
    })
  }
}

const validateMonthInFuture = (values, monthNumber, season) => {
  const currentYearAndMonth = set(new Date(), {
    date: 1,
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0
  }) // Reset to the start of the first day of the current month

  const inputDate = new Date(season, monthNumber - 1) // Month is not one-based in our app, Month is zero-based in js Date

  if (isAfter(inputDate, currentYearAndMonth)) {
    throw new JoiExternalValidationError('SMALL_CATCH_MONTH_IN_FUTURE', {
      property: 'month',
      value: values.month
    })
  }
}

const validateMethod = (values, fmtOrAdmin, methodInternal) => {
  if (!fmtOrAdmin && methodInternal) {
    throw new JoiExternalValidationError(
      'SMALL_CATCH_COUNTS_METHOD_FORBIDDEN',
      {
        property: 'counts',
        value: values.counts
      }
    )
  }
}

const validateReleased = (values) => {
  const totalCaught = values.counts ? sumCounts(values.counts) : 0
  if (values.released > totalCaught) {
    throw new JoiExternalValidationError(
      'SMALL_CATCH_RELEASED_EXCEEDS_COUNTS',
      {
        property: 'released',
        value: values.released
      }
    )
  }
}

/**
 * Joi external async validator for creating a small catch record.
 *
 * @async
 * @param {Object} values - The validated small catch payload from Joi.
 * @param {string} values.activity - Activity reference in the form `activities/{id}`.
 * @param {string} values.month - Month name (e.g. "January", "February").
 * @param {Array<Object>} values.counts - Array of method/count pairs.
 * @param {string} values.counts[].method - Method reference in the form `methods/{id}`.
 * @param {number} values.counts[].count - Number of small catches for the method.
 * @param {number} values.released - Number of released small catches.
 * @param {boolean} values.noMonthRecorded - Indicates the month was not recorded.
 * @param {boolean} values.reportingExclude - Whether this record is excluded from reporting.
 * @param {Object} helper - Joi external validation helper, including request context.
 *
 * @returns {Promise<Object|void>} Resolves with the original values on success, or
 * returns a Joi validation message object on validation failure.
 *
 * @throws {Error} Rethrows unexpected or system-level errors.
 */
const validateCreateSmallCatchAsync = async (values, helper) => {
  try {
    const activityId = extractActivityId(values.activity)
    const monthNumber = getMonthNumberFromName(values.month)
    const methods = values.counts.map((item) => item.method)
    const methodIds = methods.map((method) => extractMethodId(method))
    const fmtOrAdmin = isFMTOrAdmin(helper?.prefs?.context?.auth?.role)

    validateDuplicateMethods(values, methods)

    const results = await Promise.allSettled([
      getSubmissionByActivityId(activityId),
      isDuplicateSmallCatch(activityId, monthNumber),
      isMethodsInternal(methodIds)
    ])

    const [submission, duplicateExists, methodInternal] = results.map(unwrap)

    validateDuplicateSmallCatch(values, duplicateExists)
    validateMonthInFuture(values, monthNumber, submission.season)
    validateMethod(values, fmtOrAdmin, methodInternal)
    validateReleased(values)

    return values // remember to return values in catch
  } catch (err) {
    if (
      err.message !== 'SMALL_CATCH_MONTH_IN_FUTURE' &&
      err.message !== 'SMALL_CATCH_DUPLICATE_FOUND'
    ) {
      logger.error(err)
    }
    if (err instanceof JoiExternalValidationError) {
      return helper.message(err.code, err.context)
    }

    throw err
  }
}

/**
 * Joi external async validator for updating an existing small catch record.
 *
 * @async
 * @param {Object} values - The partial small catch update payload from Joi.
 * @param {string} values.month - Updated month name.
 * @param {Array<Object>} values.counts - Updated array of method/count pairs.
 * @param {string} values.counts[].method - Method reference in the form `methods/{id}`.
 * @param {number} values.counts[].count - Number of small catches for the method.
 * @param {number} values.released - Updated number of released small catches.
 * @param {boolean} values.noMonthRecorded - Indicates the month was not recorded.
 * @param {boolean} values.reportingExclude - Whether this record is excluded from reporting.
 * @param {Object} helper - Joi external validation helper, including request context
 *
 * @returns {Promise<Object|void>} Resolves with the original values on success, or
 * returns a Joi validation message object on validation failure.
 *
 * @throws {Error} Rethrows unexpected or system-level errors.
 */
const validateUpdateSmallCatchAsync = async (values, helper) => {
  try {
    const smallCatchId = helper.prefs.context.params.smallCatchId
    const fmtOrAdmin = isFMTOrAdmin(helper?.prefs?.context?.auth?.role)

    const smallCatch = await getSmallCatchById(smallCatchId) // todo get smallcatchcounts too

    const combinedValues = {
      month: values.month
        ? getMonthNumberFromName(values.month)
        : smallCatch.month,
      released: values.released ?? smallCatch.released
    }

    const results = await Promise.allSettled([
      getSubmissionByActivityId(smallCatch.activity_id),
      isDuplicateSmallCatch(
        smallCatch.activity_id,
        combinedValues.month,
        smallCatch.month
      ),
      getSmallCatchCountsBySmallCatchId(smallCatchId)
    ])

    const [submission, duplicateExists, smallCatchCounts] = results.map(unwrap)

    combinedValues.counts = values.counts ?? smallCatchCounts

    validateDuplicateSmallCatch(combinedValues, duplicateExists)
    validateMonthInFuture(
      combinedValues,
      combinedValues.month,
      submission.season
    )

    if (values.counts) {
      const methods = values.counts.map((item) => item.method)
      const methodIds = methods.map((method) => extractMethodId(method))
      validateDuplicateMethods(values, methods)

      const methodInternal = await isMethodsInternal(methodIds)
      validateMethod(values, fmtOrAdmin, methodInternal)
    }

    if (values.counts || values.released) {
      validateReleased(combinedValues)
    }

    return values
  } catch (err) {
    if (
      err.message !== 'SMALL_CATCH_MONTH_IN_FUTURE' &&
      err.message !== 'SMALL_CATCH_DUPLICATE_FOUND'
    ) {
      logger.error(err)
    }
    if (err instanceof JoiExternalValidationError) {
      return helper.message(err.code, err.context)
    }

    throw err
  }
}

const monthField = Joi.string()
  .invalid(null)
  .messages({
    'any.invalid': 'SMALL_CATCH_MONTH_REQUIRED'
  })
  .description('The month this record relates to')

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
  month: monthField.required().when('noMonthRecorded', {
    is: true,
    then: Joi.required().messages({
      'any.required': 'SMALL_CATCH_DEFAULT_MONTH_REQUIRED',
      'string.base': 'SMALL_CATCH_DEFAULT_MONTH_REQUIRED'
    }),
    otherwise: Joi.required().messages({
      'any.required': 'SMALL_CATCH_MONTH_REQUIRED',
      'string.base': 'SMALL_CATCH_MONTH_REQUIRED'
    })
  }),
  counts: countsField.required(),
  released: releasedField.required(),
  noMonthRecorded: noMonthRecordedField,
  reportingExclude: reportingExcludeField
})
  .external(validateCreateSmallCatchAsync)
  .unknown()

export const updateSmallCatchSchema = Joi.object({
  month: monthField.optional(),
  counts: countsField.optional(),
  released: releasedField.optional(),
  noMonthRecorded: noMonthRecordedField,
  reportingExclude: reportingExcludeField
}).external(validateUpdateSmallCatchAsync)

export const smallCatchIdSchema = Joi.object({
  smallCatchId: Joi.number().required().description('The id of the small catch')
})

export const updateSmallCatchActivityIdSchema = Joi.string()
  .required()
  .pattern(/^activities\/\d+$/)
  .messages({
    'any.required': 'SMALL_CATCH_ACTIVITY_REQUIRED',
    'string.pattern.base': 'SMALL_CATCH_ACTIVITY_INVALID'
  })
  .description('The activity associated with this small catch')
