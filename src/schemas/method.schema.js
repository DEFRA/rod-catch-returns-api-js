import Joi from 'joi'

export const methodIdSchema = Joi.object({
  methodId: Joi.number().required().description('The id of the method')
})
