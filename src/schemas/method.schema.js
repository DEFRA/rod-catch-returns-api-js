import Joi from 'joi'

// TODO add unit test
export const methodIdSchema = Joi.object({
  methodId: Joi.number().required().description('The id of the method')
})
