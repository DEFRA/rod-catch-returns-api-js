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

    it('should validate successfully when optional fields are omitted', () => {
      const payload = {}
      const { error } = createSubmissionSchema.validate(payload)

      expect(error).toBeUndefined()
    })

    it('should return an error if "contactId" is not a string', () => {
      const payload = { ...getValidPayload(), contactId: 123456 }
      const { error } = createSubmissionSchema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('"contactId" must be a string')
    })

    it('should not return an error if "season" is a number passed in as a string', () => {
      const payload = { ...getValidPayload(), season: '2024' }
      const { error } = createSubmissionSchema.validate(payload)

      expect(error).toBeUndefined()
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
