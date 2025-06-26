import { methodIdSchema } from '../method.schema'

describe('method.schema.unit', () => {
  describe('methodIdSchema', () => {
    it('should validate successfully when "methodId" is provided and valid', () => {
      const params = { methodId: 123 }
      const { error } = methodIdSchema.validate(params)

      expect(error).toBeUndefined()
    })

    it('should return an error if "methodId" is missing', () => {
      const params = { methodId: undefined }
      const { error } = methodIdSchema.validate(params)

      expect(error.details[0].message).toContain('"methodId" is required')
    })

    it('should return an error if "methodId" is not a number', () => {
      const params = { methodId: 'abc' }
      const { error } = methodIdSchema.validate(params)

      expect(error.details[0].message).toContain('"methodId" must be a number')
    })
  })
})
