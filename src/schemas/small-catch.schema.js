import Joi from 'joi'
import { extractActivityId } from '../utils/entity-utils'
import { getMonthNumberFromName } from '../utils/date-utils'
import { getSubmissionByActivityId } from '../services/activities.service'
import { isDuplicateSmallCatch } from '../services/small-catch.service'

export const createSmallCatchSchema = Joi.object({
  activity: Joi.string().required().messages({
    'any.required': 'ACTIVITY_REQUIRED'
  }),
  month: Joi.string()
    .required()
    .when('noMonthRecorded', {
      is: true,
      then: Joi.required().messages({
        'any.required': 'DEFAULT_MONTH_REQUIRED'
      }),
      otherwise: Joi.required().messages({
        'any.required': 'MONTH_REQUIRED'
      })
    })
    .external(async (value, helper) => {
      const activityId = extractActivityId(helper.state.ancestors[0].activity)

      const duplicateExists = await isDuplicateSmallCatch(activityId, value)
      if (duplicateExists) {
        return helper.message('DUPLICATE_FOUND')
      }

      return value
    }),
  released: Joi.number().integer().min(0).required().messages({
    'any.required': 'RELEASED_REQUIRED',
    'number.base': 'RELEASED_NUMBER',
    'number.integer': 'RELEASED_INTEGER',
    'number.min': 'RELEASED_NEGATIVE'
  }),
  counts: Joi.array()
    .items(
      Joi.object({
        method: Joi.string().required().messages({
          'any.required': 'METHOD_REQUIRED'
        }),
        count: Joi.number().integer().min(0).required().messages({
          'any.required': 'COUNT_REQUIRED',
          'number.base': 'COUNT_NUMBER',
          'number.integer': 'COUNT_INTEGER',
          'number.min': 'COUNT_NEGATIVE'
        })
      })
    )
    .required()
    .messages({
      'any.required': 'COUNTS_REQUIRED',
      'array.base': 'COUNTS_ARRAY'
    })
    .custom((value, helper) => {
      const methods = value.map((item) => item.method)
      const hasDuplicates = new Set(methods).size !== methods.length
      if (hasDuplicates) {
        return helper.message('COUNTS_METHOD_DUPLICATE_FOUND')
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
    return helper.message('Date must be before the current month and year')
  }

  return value
})
