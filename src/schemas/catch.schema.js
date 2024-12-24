import { extractActivityId, extractMethodId } from '../utils/entity-utils.js'
import Joi from 'joi'
import { MEASURES } from '../utils/constants.js'
import { convertKgtoOz } from '../utils/mass-utils.js'
import { getSubmissionByActivityId } from '../services/activities.service.js'
import { isMethodInternal } from '../services/methods.service.js'

const MAX_FISH_MASS_KG = 50 // Maximum possible mass of a salmon/sea trout (world record is about 48kg)
const MAX_FISH_MASS_OZ = convertKgtoOz(MAX_FISH_MASS_KG) // 1763.698097oz
const MIN_FISH_MASS = 0

const validateMethod = async (value, helper) => {
  const methodId = extractMethodId(value)
  const methodInternal = await isMethodInternal(methodId)
  return methodInternal ? helper.message('CATCH_METHOD_FORBIDDEN') : value
}

export const createCatchSchema = Joi.object({
  activity: Joi.string()
    .required()
    .pattern(/^activities\//)
    .messages({
      'any.required': 'CATCH_ACTIVITY_REQUIRED',
      'string.pattern.base': 'CATCH_ACTIVITY_INVALID'
    })
    .description('The activity associated with this catch'),
  dateCaught: Joi.string()
    .required()
    .when('noDateRecorded', {
      is: true,
      then: Joi.required().messages({
        'any.required': 'CATCH_DEFAULT_DATE_REQUIRED',
        'string.base': 'CATCH_DEFAULT_DATE_REQUIRED'
      }),
      otherwise: Joi.when('onlyMonthRecorded', {
        is: true,
        then: Joi.required().messages({
          'any.required': 'CATCH_DEFAULT_DATE_REQUIRED',
          'string.base': 'CATCH_DEFAULT_DATE_REQUIRED'
        }),
        otherwise: Joi.string().required().messages({
          'any.required': 'CATCH_DATE_REQUIRED',
          'string.base': 'CATCH_DATE_REQUIRED'
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

      return value
    })
    .description('The date of the catch'),
  onlyMonthRecorded: Joi.boolean()
    .when('noDateRecorded', {
      is: true,
      then: Joi.valid(false).messages({
        // If noDateRecorded is true, onlyMonthRecorded is constrained to be false using Joi.valid(false).
        'any.only': 'CATCH_NO_DATE_RECORDED_WITH_ONLY_MONTH_RECORDED'
      })
    })
    .description('To allow FMT users to report on the default dates'),
  noDateRecorded: Joi.boolean().description(
    'To allow FMT users to report on the default month'
  ),
  species: Joi.string()
    .required()
    .messages({
      'any.required': 'CATCH_SPECIES_REQUIRED'
    })
    .description('The species of catch (Salmon, Sea Trout)'),
  mass: Joi.object({
    kg: Joi.number()
      .min(MIN_FISH_MASS)
      .max(MAX_FISH_MASS_KG)
      .when('type', {
        is: MEASURES.METRIC,
        then: Joi.required().messages({
          'any.required': 'CATCH_MASS_KG_REQUIRED'
        })
      })
      .messages({
        'number.base': 'CATCH_MASS_KG_REQUIRED',
        'number.positive': 'CATCH_MASS_KG_POSITIVE',
        'number.min': 'CATCH_MASS_BELOW_MINIMUM',
        'number.max': 'CATCH_MASS_MAX_EXCEEDED'
      })
      .description('The mass of the catch in metric kg'),
    oz: Joi.number()
      .min(MIN_FISH_MASS)
      .max(MAX_FISH_MASS_OZ)
      .when('type', {
        is: MEASURES.IMPERIAL,
        then: Joi.required().messages({
          'any.required': 'CATCH_MASS_OZ_REQUIRED'
        })
      })
      .messages({
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
    .required()
    .messages({
      'any.required': 'CATCH_MASS_REQUIRED'
    })
    .description('The mass of the catch'),
  method: Joi.string()
    .required()
    .external(validateMethod)
    .pattern(/^methods\//)
    .description('The method id prefixed with methods/')
    .messages({
      'any.required': 'CATCH_METHOD_REQUIRED',
      'string.pattern.base': 'CATCH_METHOD_INVALID'
    }),
  released: Joi.boolean()
    .required()
    .description('Was the catch released?')
    .messages({
      'any.required': 'CATCH_RELEASED_REQUIRED',
      'boolean.base': 'CATCH_RELEASED_REQUIRED'
    }),
  reportingExclude: Joi.boolean().description(
    'Is this entry excluded from reporting'
  )
}).unknown()

export const catchIdSchema = Joi.object({
  catchId: Joi.number().required().description('The id of the catch')
})
