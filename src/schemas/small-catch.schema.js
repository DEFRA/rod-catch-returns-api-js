import Joi from 'joi'
import { extractActivityId } from '../utils/entity-utils'
import { getMonthNumberFromName } from '../utils/date-utils'
import { getSubmissionByActivityId } from '../services/activities.service'

export const createSmallCatchSchema = Joi.object({
  activity: Joi.string().required(),
  month: Joi.string().required()
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
