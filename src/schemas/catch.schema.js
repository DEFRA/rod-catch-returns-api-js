import Joi from 'joi'
import { Measures } from '../utils/constants.js'
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
    }),
  onlyMonthRecorded: Joi.boolean()
    .required()
    .when('noDateRecorded', {
      is: true,
      then: Joi.valid(false).messages({
        // If noDateRecorded is true, onlyMonthRecorded is constrained to be false using Joi.valid(false).
        'any.only': 'CATCH_NO_DATE_RECORDED_WITH_ONLY_MONTH_RECORDED'
      })
    }),
  noDateRecorded: Joi.boolean().required(),
  species: Joi.string().required().messages({
    'any.required': 'CATCH_SPECIES_REQUIRED'
  }),
  mass: Joi.object({
    kg: Joi.number()
      .positive()
      .when('type', {
        is: Measures.METRIC,
        then: Joi.required().messages({
          'any.required': 'CATCH_MASS_KG_REQUIRED'
        })
      })
      .messages({
        'number.positive': 'CATCH_MASS_KG_POSITIVE'
      }),
    oz: Joi.number()
      .positive()
      .when('type', {
        is: Measures.IMPERIAL,
        then: Joi.required().messages({
          'any.required': 'CATCH_MASS_OZ_REQUIRED'
        })
      })
      .messages({
        'number.positive': 'CATCH_MASS_OZ_POSITIVE'
      }),
    type: Joi.string()
      .valid(...Object.values(Measures))
      .required()
      .messages({
        'any.required': 'CATCH_MASS_TYPE_REQUIRED',
        'any.only': 'CATCH_MASS_TYPE_INVALID'
      })
  })
    .required()
    .messages({
      'any.required': 'CATCH_MASS_REQUIRED'
    })
}).unknown()
