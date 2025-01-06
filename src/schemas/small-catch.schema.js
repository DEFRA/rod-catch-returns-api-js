import {
  getSmallCatchById,
  isDuplicateSmallCatch
} from '../services/small-catch.service.js'
import { isAfter, set } from 'date-fns'
import Joi from 'joi'
import { extractActivityId } from '../utils/entity-utils.js'
import { getMonthNumberFromName } from '../utils/date-utils.js'
import { getSubmissionByActivityId } from '../services/activities.service.js'

const monthField = Joi.string()

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

      // check duplicates
      const month = getMonthNumberFromName(value)
      const duplicateExists = await isDuplicateSmallCatch(activityId, month)
      if (duplicateExists) {
        return helper.message('SMALL_CATCH_DUPLICATE_FOUND')
      }

      // check month in future
      const submission = await getSubmissionByActivityId(activityId)

      const currentYearAndMonth = set(new Date(), {
        date: 1,
        hours: 0,
        minutes: 0,
        seconds: 0,
        milliseconds: 0
      }) // Reset to the start of the first day of the current month

      const inputMonth = getMonthNumberFromName(value) // Month is not one-based in our app
      const inputDate = new Date(submission.season, inputMonth - 1) // Month is zero-based in js Date

      if (isAfter(inputDate, currentYearAndMonth)) {
        return helper.message('SMALL_CATCH_MONTH_IN_FUTURE')
      }

      return value
    }),
  counts: Joi.array()
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
    .required()
    .min(1)
    .messages({
      'any.required': 'SMALL_CATCH_COUNTS_REQUIRED',
      'array.base': 'SMALL_CATCH_COUNTS_REQUIRED',
      'array.min': 'SMALL_CATCH_COUNTS_REQUIRED'
    })
    .custom((value, helper) => {
      const methods = value.map((item) => item.method)
      const hasDuplicates = new Set(methods).size !== methods.length
      if (hasDuplicates) {
        return helper.message('SMALL_CATCH_COUNTS_METHOD_DUPLICATE_FOUND')
      }
      return value
    }),
  released: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'any.required': 'SMALL_CATCH_RELEASED_REQUIRED',
      'number.base': 'SMALL_CATCH_RELEASED_NUMBER',
      'number.integer': 'SMALL_CATCH_RELEASED_INTEGER',
      'number.min': 'SMALL_CATCH_RELEASED_NEGATIVE'
    })
    .custom((value, helper) => {
      const countsArray = helper.state.ancestors[0].counts
      const totalCaught = countsArray.reduce((sum, item) => sum + item.count, 0)

      if (value > totalCaught) {
        return helper.message('SMALL_CATCH_RELEASED_EXCEEDS_COUNTS')
      }

      return value
    }),
  noMonthRecorded: Joi.boolean()
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

    // check duplicates
    const month = getMonthNumberFromName(value)
    const duplicateExists = await isDuplicateSmallCatch(
      smallCatch.activityId,
      month,
      smallCatch.month
    )
    if (duplicateExists) {
      return helper.message('SMALL_CATCH_DUPLICATE_FOUND')
    }

    // check month in future
    const submission = await getSubmissionByActivityId(smallCatch.activityId)

    const currentYearAndMonth = set(new Date(), {
      date: 1,
      hours: 0,
      minutes: 0,
      seconds: 0,
      milliseconds: 0
    }) // Reset to the start of the first day of the current month

    const inputMonth = getMonthNumberFromName(value) // Month is not one-based in our app
    const inputDate = new Date(submission.season, inputMonth - 1) // Month is zero-based in js Date

    if (isAfter(inputDate, currentYearAndMonth)) {
      return helper.message('SMALL_CATCH_MONTH_IN_FUTURE')
    }

    return value
  })
})

export const smallCatchIdSchema = Joi.object({
  smallCatchId: Joi.number().required().description('The id of the small catch')
})
