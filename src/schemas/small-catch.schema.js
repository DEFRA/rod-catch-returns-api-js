import Joi from 'joi'
import { extractActivityId } from '../utils/entity-utils'
import { getMonthNumberFromName } from '../utils/date-utils'
import { getSubmissionByActivityId } from '../services/activities.service'

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
    }),
  counts: Joi.number().integer().min(0).required().messages({
    'any.required': 'COUNTS_REQUIRED',
    'number.base': 'COUNTS_NUMBER',
    'number.integer': 'COUNTS_INTEGER',
    'number.min': 'COUNTS_NEGATIVE'
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
