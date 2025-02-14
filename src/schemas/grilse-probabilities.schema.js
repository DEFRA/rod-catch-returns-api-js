import Joi from 'joi'

export const grilseProbabilityRequestParamSchema = Joi.object({
  season: Joi.number()
    .required()
    .description('The year which the grilse probabilities file relates to'),
  gate: Joi.number()
    .required()
    .description('The gate which the grilse probabilities file relates to')
})

export const grilseProbabilityRequestQuerySchema = Joi.object({
  overwrite: Joi.boolean().optional(
    'A boolean to say whether the grilse probabilities for the specified season and gate should be overridden'
  )
})
