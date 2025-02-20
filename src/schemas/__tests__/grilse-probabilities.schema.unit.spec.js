import {
  grilseProbabilityRequestParamSchema,
  grilseProbabilityRequestQuerySchema
} from '../grilse-probabilities.schema.js'

describe('grilse-probabilities.schema.unit', () => {
  describe('grilseProbabilityRequestParamSchema', () => {
    it.each([
      ['numbers', { season: 2024, gate: 1 }],
      ['strings', { season: '2024', gate: '1' }]
    ])(
      'should validate successfully when "season" and "gate" are provided as %s',
      (_, params) => {
        const { error } = grilseProbabilityRequestParamSchema.validate(params)

        expect(error).toBeUndefined()
      }
    )

    it.each([
      ['season', { gate: 1 }],
      ['gate', { season: 2024 }]
    ])('should return an error if %s is missing', (field, params) => {
      const { error } = grilseProbabilityRequestParamSchema.validate(params)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain(`"${field}" is required`)
    })

    it.each([
      ['season', { season: 'abc', gate: 1 }],
      ['gate', { season: 2024, gate: 'abc' }]
    ])('should return an error if a %s is not a number', (field, params) => {
      const { error } = grilseProbabilityRequestParamSchema.validate(params)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain(`"${field}" must be a number`)
    })
  })

  describe('grilseProbabilityRequestQuerySchema', () => {
    it.each([
      ['true as a boolean', { overwrite: true }],
      ['false as a boolean', { overwrite: false }],
      ['true as a string', { overwrite: 'true' }],
      ['false as a string', { overwrite: 'false' }],
      ['not provided', {}]
    ])('should validate successfully when "overwrite" is %s', (_, query) => {
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
