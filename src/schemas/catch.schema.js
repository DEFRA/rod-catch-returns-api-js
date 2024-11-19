import Joi from 'joi'

export const createCatchSchema = Joi.object({
  activity: Joi.string().required().messages({
    'any.required': 'CATCH_ACTIVITY_REQUIRED'
  })
})
