import Joi from 'joi'
import { extractActivityId } from '../utils/entity-utils.js'
import { getSubmissionByActivityId } from '../services/activities.service.js'

export const createCatchSchema = Joi.object({
  activity: Joi.string().required().messages({
    'any.required': 'CATCH_ACTIVITY_REQUIRED'
  }),
  dateCaught: Joi.string()
    .required()
    .when('noDateRecorded', {
      is: true,
      then: Joi.required().messages({
        'any.required': 'CATCH_DEFAULT_DATE_REQUIRED'
      }),
      otherwise: Joi.when('onlyMonthRecorded', {
        is: true,
        then: Joi.required().messages({
          'any.required': 'CATCH_DEFAULT_DATE_REQUIRED'
        }),
        otherwise: Joi.string().required().messages({
          'any.required': 'CATCH_DATE_REQUIRED'
        })
      })
    })
    .external(async (value, helper) => {
      const activityId = extractActivityId(helper.state.ancestors[0].activity)
      const submission = await getSubmissionByActivityId(activityId)

      const parsedDate = new Date(value)
      const currentDate = new Date()

      if (parsedDate > currentDate) {
        return helper.message('CATCH_DATE_IN_FUTURE')
      }

      const yearCaught = parsedDate.getFullYear()

      if (submission.season !== yearCaught) {
        return helper.message('CATCH_YEAR_MISMATCH')
      }
    })
}).unknown()
