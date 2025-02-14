import {
  grilseProbabilityRequestParamSchema,
  grilseProbabilityRequestQuerySchema
} from '../grilse-probabilities.schema.js'

describe('grilse-probabilities.schema.unit', () => {
  describe('grilseProbabilityRequestParamSchema', () => {
    it('should validate successfully when "season" and "gate" are provided as numbers', () => {
      const params = { season: 2024, gate: 1 }
      const { error } = grilseProbabilityRequestParamSchema.validate(params)

      expect(error).toBeUndefined()
    })

    it('should validate successfully when "season" and "gate" are provided as strings', () => {
      const params = { season: '2024', gate: '1' }
      const { error } = grilseProbabilityRequestParamSchema.validate(params)

      expect(error).toBeUndefined()
    })

    it('should return an error if the "season" field is missing', () => {
      const params = { gate: 1 }
      const { error } = grilseProbabilityRequestParamSchema.validate(params)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('"season" is required')
    })

    it('should return an error if the "gate" field is missing', () => {
      const params = { season: 2024 }
      const { error } = grilseProbabilityRequestParamSchema.validate(params)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('"gate" is required')
    })

    it('should return an error if "season" is not a number', () => {
      const params = { season: 'abc', gate: 1 }
      const { error } = grilseProbabilityRequestParamSchema.validate(params)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('"season" must be a number')
    })

    it('should return an error if "gate" is not a number', () => {
      const params = { season: 2024, gate: 'abc' }
      const { error } = grilseProbabilityRequestParamSchema.validate(params)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('"gate" must be a number')
    })
  })

  describe('grilseProbabilityRequestQuerySchema', () => {
    it('should validate successfully when "overwrite" is true as a boolean', () => {
      const query = { overwrite: true }
      const { error } = grilseProbabilityRequestQuerySchema.validate(query)

      expect(error).toBeUndefined()
    })

    it('should validate successfully when "overwrite" is false as a boolean', () => {
      const query = { overwrite: false }
      const { error } = grilseProbabilityRequestQuerySchema.validate(query)

      expect(error).toBeUndefined()
    })

    it('should validate successfully when "overwrite" is a true as a string', () => {
      const query = { overwrite: 'true' }
      const { error } = grilseProbabilityRequestQuerySchema.validate(query)

      expect(error).toBeUndefined()
    })

    it('should validate successfully when "overwrite" is a false as a string', () => {
      const query = { overwrite: 'false' }
      const { error } = grilseProbabilityRequestQuerySchema.validate(query)

      expect(error).toBeUndefined()
    })

    it('should validate successfully when "overwrite" is not provided', () => {
      const query = {}
      const { error } = grilseProbabilityRequestQuerySchema.validate(query)

      expect(error).toBeUndefined()
    })

    it('should return an error if "overwrite" is not a boolean', () => {
      const query = { overwrite: 'bob' }
      const { error } = grilseProbabilityRequestQuerySchema.validate(query)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain(
        '"overwrite" must be a boolean'
      )
    })
  })
})
