import Joi from 'joi'

export const licenceLoginRequestQuerySchema = Joi.object({
  verification: Joi.string().description(
    'The postcode to cross-check against the licence number'
  )
})

export const licenceLoginRequestParamSchema = Joi.object({
  licence: Joi.string()
    .required()
    .description('The last 6 digits of the licence number')
})
