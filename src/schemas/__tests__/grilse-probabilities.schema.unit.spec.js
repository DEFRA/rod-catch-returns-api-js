import {
  getGrilseProbabilityRequestParamSchema,
  postGrilseProbabilityRequestParamSchema,
  postGrilseProbabilityRequestQuerySchema
} from '../grilse-probabilities.schema.js'

describe('grilse-probabilities.schema.unit', () => {
  describe('postGrilseProbabilityRequestParamSchema', () => {
    it.each([
      ['numbers', { season: 2024, gate: 1 }],
      ['strings', { season: '2024', gate: '1' }]
    ])(
      'should validate successfully when "season" and "gate" are provided as %s',
      (_, params) => {
        const { error } =
          postGrilseProbabilityRequestParamSchema.validate(params)

        expect(error).toBeUndefined()
      }
    )

    it.each([
      ['season', { gate: 1 }],
      ['gate', { season: 2024 }]
    ])('should return an error if %s is missing', (field, params) => {
      const { error } = postGrilseProbabilityRequestParamSchema.validate(params)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain(`"${field}" is required`)
    })

    it.each([
      ['season', { season: 'abc', gate: 1 }],
      ['gate', { season: 2024, gate: 'abc' }]
    ])('should return an error if a %s is not a number', (field, params) => {
      const { error } = postGrilseProbabilityRequestParamSchema.validate(params)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain(`"${field}" must be a number`)
    })
  })

  describe('postGrilseProbabilityRequestQuerySchema', () => {
    it.each([
      ['true as a boolean', { overwrite: true }],
      ['false as a boolean', { overwrite: false }],
      ['true as a string', { overwrite: 'true' }],
      ['false as a string', { overwrite: 'false' }],
      ['not provided', {}]
    ])('should validate successfully when "overwrite" is %s', (_, query) => {
      const { error } = postGrilseProbabilityRequestQuerySchema.validate(query)

      expect(error).toBeUndefined()
    })

    it('should return an error if "overwrite" is not a boolean', () => {
      const query = { overwrite: 'bob' }
      const { error } = postGrilseProbabilityRequestQuerySchema.validate(query)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain(
        '"overwrite" must be a boolean'
      )
    })
  })

  describe('getGrilseProbabilityRequestParamSchema', () => {
    it.each([
      ['a single year as a string', { season: '2024' }],
      ['a season range', { season: '2023-2025' }]
    ])('should validate successfully when "season" is %s', (_, params) => {
      const { error } = getGrilseProbabilityRequestParamSchema.validate(params)

      expect(error).toBeUndefined()
    })

    it('should return an error if "season" is missing', () => {
      const params = {}
      const { error } = getGrilseProbabilityRequestParamSchema.validate(params)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('"season" is required')
    })

    it.each([
      ['not a number', { season: 'abcd' }],
      ['an invalid range format', { season: '2023/2025' }],
      ['a range with non-numeric values', { season: '20ab-20cd' }]
    ])('should return an error if "season" is %s', (_, params) => {
      const { error } = getGrilseProbabilityRequestParamSchema.validate(params)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('"season"')
    })
  })
})
