import Joi from 'joi'

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
}).unknown()
