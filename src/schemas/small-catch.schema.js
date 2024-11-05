import Joi from 'joi'
import { extractActivityId } from '../utils/entity-utils'
import { getMonthNumberFromName } from '../utils/date-utils'
import { getSubmissionByActivityId } from '../services/activities.service'
import { isDuplicateSmallCatch } from '../services/small-catch.service'

export const createSmallCatchSchema = Joi.object({
  activity: Joi.string().required().messages({
    'any.required': 'SMALL_CATCH_ACTIVITY_REQUIRED'
  }),
  month: Joi.string()
    .required()
    .when('noMonthRecorded', {
      is: true,
      then: Joi.required().messages({
        'any.required': 'SMALL_CATCH_DEFAULT_MONTH_REQUIRED'
      }),
      otherwise: Joi.required().messages({
        'any.required': 'SMALL_CATCH_MONTH_REQUIRED'
      })
    })
    .external(async (value, helper) => {
      const activityId = extractActivityId(helper.state.ancestors[0].activity)

      const duplicateExists = await isDuplicateSmallCatch(activityId, value)
      if (duplicateExists) {
        return helper.message('SMALL_CATCH_DUPLICATE_FOUND')
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
    .messages({
      'any.required': 'SMALL_CATCH_COUNTS_REQUIRED',
      'array.base': 'SMALL_CATCH_COUNTS_REQUIRED'
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
      const countsArray = helper.state.ancestors[0].counts || []
      const totalCaught = countsArray.reduce((sum, item) => sum + item.count, 0)

      if (value > totalCaught) {
        return helper.message('SMALL_CATCH_RELEASED_EXCEEDS_COUNTS')
      }

      return value
    }),
  noMonthRecorded: Joi.boolean()
}).external(async (value, helper) => {
  const activityId = extractActivityId(value.submission)
  const submission = await getSubmissionByActivityId(activityId)

  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  const inputMonth = getMonthNumberFromName(value.month)

  if (
    submission.season > currentYear ||
    (submission.season === currentYear && inputMonth > currentMonth)
  ) {
    return helper.message('SMALL_CATCH_MONTH_IN_FUTURE')
  }

  return value
})
