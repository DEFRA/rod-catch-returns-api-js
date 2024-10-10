import { createSubmissionSchema } from '../submission.schema.js'

describe('Validation Schemas', () => {
  describe('createSubmissionSchema', () => {
    const getValidPayload = () => ({
      contactId: '123456',
      season: 2024,
      status: 'SUBMITTED',
      source: 'WEB'
    })

    it('should validate successfully when all fields are provided and valid', () => {
      const payload = getValidPayload()
      const { error } = createSubmissionSchema.validate(payload)

      expect(error).toBeUndefined()
    })

    it('should return an error if "contactId" is not a string', () => {
      const payload = { ...getValidPayload(), contactId: 123456 }
      const { error } = createSubmissionSchema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('"contactId" must be a string')
    })

    it('should validate successfully if "season" is a number passed in as a string', () => {
      const payload = { ...getValidPayload(), season: '2024' }
      const { error } = createSubmissionSchema.validate(payload)

      expect(error).toBeUndefined()
    })

    it('should return an error if "season" a string without numbers', () => {
      const payload = { ...getValidPayload(), season: 'abc123' }
      const { error } = createSubmissionSchema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('"season" must be a number')
    })

    const currentYear = new Date().getFullYear()

    it('should validate when the season is the current year', () => {
      const result = createSubmissionSchema.validate({
        ...getValidPayload(),
        season: currentYear
      })
      expect(result.error).toBeUndefined()
    })

    it('should validate when the season is a past year', () => {
      const result = createSubmissionSchema.validate({
        ...getValidPayload(),
        season: currentYear - 1
      })
      expect(result.error).toBeUndefined()
    })

    it('should return an error when the season is a future year', () => {
      const result = createSubmissionSchema.validate({
        ...getValidPayload(),
        season: currentYear + 1
      })
      expect(result.error).toBeDefined()
      expect(result.error.details[0].message).toBe(
        `Season must not be later than the current year (${currentYear}).`
      )
    })

    it('should return an error if "status" is not one of the allowed values', () => {
      const payload = { ...getValidPayload(), status: 'PENDING' }
      const { error } = createSubmissionSchema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain(
        '"status" must be one of [INCOMPLETE, SUBMITTED]'
      )
    })

    it('should return an error if "source" is not one of the allowed values', () => {
      const payload = { ...getValidPayload(), source: 'EMAIL' }
      const { error } = createSubmissionSchema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain(
        '"source" must be one of [WEB, PAPER]'
      )
    })
  })
})
