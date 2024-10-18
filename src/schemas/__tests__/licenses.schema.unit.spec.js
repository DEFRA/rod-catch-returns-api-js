import {
  licenceLoginRequestParamSchema,
  licenceLoginRequestQuerySchema
} from '../licences.schema.js'

describe('licenses.schema.unit', () => {
  describe('licenceLoginRequestQuerySchema', () => {
    it('should validate successfully when the "verification" field is a string', () => {
      const query = { verification: 'AB12 3CD' }
      const { error } = licenceLoginRequestQuerySchema.validate(query)

      expect(error).toBeUndefined()
    })

    it('should return an error if the "verification" field is not a string', () => {
      const query = { verification: 12345 }
      const { error } = licenceLoginRequestQuerySchema.validate(query)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain(
        '"verification" must be a string'
      )
    })
  })

  describe('licenceLoginRequestParamSchema', () => {
    it('should validate successfully when the "licence" field is provided and is a string', () => {
      const params = { licence: '123456' }
      const { error } = licenceLoginRequestParamSchema.validate(params)

      expect(error).toBeUndefined()
    })

    it('should return an error if the "licence" field is missing', () => {
      const params = {}
      const { error } = licenceLoginRequestParamSchema.validate(params)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('"licence" is required')
    })

    it('should return an error if the "licence" field is not a string', () => {
      const params = { licence: 123456 }
      const { error } = licenceLoginRequestParamSchema.validate(params)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('"licence" must be a string')
    })
  })
})
