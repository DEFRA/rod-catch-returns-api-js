import {
  createSubmissionSchema,
  getBySubmissionIdSchema,
  getSubmissionByContactAndSeasonSchema,
  getSubmissionsByContactSchema,
  updateSubmissionSchema
} from '../submission.schema.js'

describe('Validation Schemas', () => {
  describe('createSubmissionSchema', () => {
    const getValidPayload = () => ({
      contactId: '123456',
      season: 2024,
      status: 'SUBMITTED',
      source: 'WEB'
    })

    beforeEach(() => {
      jest.useRealTimers()
    })

    it('should validate successfully when all fields are provided and valid', () => {
      const payload = getValidPayload()
      const { error } = createSubmissionSchema.validate(payload)

      expect(error).toBeUndefined()
    })

    it('should not cache the date when the file is loaded into memory', () => {
      jest.useFakeTimers().setSystemTime(new Date('2024-01-01'))
      const payload = getValidPayload()
      const { error } = createSubmissionSchema.validate(payload)
      expect(error).toBeUndefined()

      jest.useFakeTimers().setSystemTime(new Date('2025-01-01'))
      const payload2 = {
        ...getValidPayload(),
        season: 2025
      }
      const { error2 } = createSubmissionSchema.validate(payload2)
      expect(error2).toBeUndefined()
    })

    it('should return an error if "contactId" is undefined', () => {
      const payload = { ...getValidPayload(), contactId: undefined }
      const { error } = createSubmissionSchema.validate(payload)

      expect(error.details[0].message).toContain(
        'SUBMISSION_CONTACT_ID_REQUIRED'
      )
    })

    it('should return an error if "contactId" is not a string', () => {
      const payload = { ...getValidPayload(), contactId: 123456 }
      const { error } = createSubmissionSchema.validate(payload)

      expect(error.details[0].message).toContain(
        'SUBMISSION_CONTACT_ID_INVALID'
      )
    })

    it('should validate successfully if "season" is a number passed in as a string', () => {
      const payload = { ...getValidPayload(), season: '2024' }
      const { error } = createSubmissionSchema.validate(payload)

      expect(error).toBeUndefined()
    })

    it('should return an error if "season" is undefined', () => {
      const payload = { ...getValidPayload(), season: undefined }
      const { error } = createSubmissionSchema.validate(payload)

      expect(error.details[0].message).toContain('SUBMISSION_SEASON_REQUIRED')
    })

    it('should return an error if "season" a string without numbers', () => {
      const payload = { ...getValidPayload(), season: 'abc123' }
      const { error } = createSubmissionSchema.validate(payload)

      expect(error.details[0].message).toContain('SUBMISSION_SEASON_INVALID')
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

      expect(result.error.details[0].message).toBe('SUBMISSION_SEASON_INVALID')
    })

    it('should return an error if "status" undefined', () => {
      const payload = { ...getValidPayload(), status: undefined }
      const { error } = createSubmissionSchema.validate(payload)

      expect(error.details[0].message).toBe('SUBMISSION_STATUS_REQUIRED')
    })

    it('should return an error if "status" is not one of the allowed values', () => {
      const payload = { ...getValidPayload(), status: 'PENDING' }
      const { error } = createSubmissionSchema.validate(payload)

      expect(error.details[0].message).toContain(
        '"status" must be one of [INCOMPLETE, SUBMITTED]'
      )
    })

    it('should return an error if "source" is undefined', () => {
      const payload = { ...getValidPayload(), source: undefined }
      const { error } = createSubmissionSchema.validate(payload)

      expect(error.details[0].message).toBe('SUBMISSION_SOURCE_REQUIRED')
    })

    it('should return an error if "source" is not one of the allowed values', () => {
      const payload = { ...getValidPayload(), source: 'EMAIL' }
      const { error } = createSubmissionSchema.validate(payload)

      expect(error.details[0].message).toContain(
        '"source" must be one of [WEB, PAPER]'
      )
    })
  })

  describe('updateSubmissionSchema', () => {
    const getValidPayload = () => ({
      status: 'SUBMITTED',
      reportingExclude: true
    })

    it('should validate successfully when all fields are provided and valid', () => {
      const payload = getValidPayload()
      const { error } = updateSubmissionSchema.validate(payload)

      expect(error).toBeUndefined()
    })

    it('should validate successfully when "status" is provided and valid', () => {
      const payload = { status: 'INCOMPLETE' }
      const { error } = updateSubmissionSchema.validate(payload)

      expect(error).toBeUndefined()
    })

    it('should validate successfully when "reportingExclude" is provided and valid', () => {
      const payload = { reportingExclude: true }
      const { error } = updateSubmissionSchema.validate(payload)

      expect(error).toBeUndefined()
    })

    it('should validate successfully when no fields are provided (partial update)', () => {
      const payload = {}
      const { error } = updateSubmissionSchema.validate(payload)

      expect(error).toBeUndefined()
    })

    it('should return an error if "status" is not one of the allowed values', () => {
      const payload = { status: 'PENDING' }
      const { error } = updateSubmissionSchema.validate(payload)

      expect(error.details[0].message).toContain(
        '"status" must be one of [INCOMPLETE, SUBMITTED]'
      )
    })

    it('should return an error if "reportingExclude" is not a boolean', () => {
      const payload = { reportingExclude: 'yes' }
      const { error } = updateSubmissionSchema.validate(payload)

      expect(error.details[0].message).toContain(
        '"reportingExclude" must be a boolean'
      )
    })

    it('should validate successfully when unknown fields are included (due to `.unknown()`)', () => {
      const payload = {
        status: 'SUBMITTED',
        reportingExclude: true,
        extraField: 'allowed'
      }
      const { error } = updateSubmissionSchema.validate(payload)

      expect(error).toBeUndefined()
    })
  })

  describe('getSubmissionByContactAndSeasonSchema', () => {
    const getValidQuery = () => ({
      contact_id: 'contact-identifier-111',
      season: 2024
    })

    it('should validate successfully when all fields are provided and valid', () => {
      const query = getValidQuery()
      const { error } = getSubmissionByContactAndSeasonSchema.validate(query)

      expect(error).toBeUndefined()
    })

    it('should return an error if "contact_id" is not a string', () => {
      const query = { ...getValidQuery(), contact_id: 123456 }
      const { error } = getSubmissionByContactAndSeasonSchema.validate(query)

      expect(error.details[0].message).toContain(
        'SUBMISSION_CONTACT_ID_INVALID'
      )
    })

    it('should validate successfully if "season" is a number passed in as a string', () => {
      const query = { ...getValidQuery(), season: '2024' }
      const { error } = getSubmissionByContactAndSeasonSchema.validate(query)

      expect(error).toBeUndefined()
    })

    it('should return an error if "season" is not a number', () => {
      const query = { ...getValidQuery(), season: 'invalidYear' }
      const { error } = getSubmissionByContactAndSeasonSchema.validate(query)

      expect(error.details[0].message).toContain('SUBMISSION_SEASON_INVALID')
    })

    it('should return an error if "season" is missing', () => {
      const query = { ...getValidQuery(), season: undefined }
      const { error } = getSubmissionByContactAndSeasonSchema.validate(query)

      expect(error.details[0].message).toContain('SUBMISSION_SEASON_REQUIRED')
    })

    it('should return an error if "contact_id" is missing', () => {
      const query = { ...getValidQuery(), contact_id: undefined }
      const { error } = getSubmissionByContactAndSeasonSchema.validate(query)

      expect(error.details[0].message).toContain(
        'SUBMISSION_CONTACT_ID_REQUIRED'
      )
    })
  })

  describe('getSubmissionsByContactSchema', () => {
    it('should validate successfully when all fields are provided and valid', () => {
      const query = { contact_id: 'contact-identifier-111' }
      const { error } = getSubmissionsByContactSchema.validate(query)

      expect(error).toBeUndefined()
    })

    it('should return an error if "contact_id" is not a string', () => {
      const query = { contact_id: 123456 }
      const { error } = getSubmissionsByContactSchema.validate(query)

      expect(error.details[0].message).toContain(
        'SUBMISSION_CONTACT_ID_INVALID'
      )
    })

    it('should return an error if "contact_id" is missing', () => {
      const query = {}
      const { error } = getSubmissionsByContactSchema.validate(query)

      expect(error.details[0].message).toContain(
        'SUBMISSION_CONTACT_ID_REQUIRED'
      )
    })
  })

  describe('getBySubmissionIdSchema', () => {
    it('should validate successfully when "submissionId" is provided and valid', () => {
      const params = { submissionId: 123 }
      const { error } = getBySubmissionIdSchema.validate(params)

      expect(error).toBeUndefined()
    })

    it('should return an error if "submissionId" is missing', () => {
      const params = { submissionId: undefined }
      const { error } = getBySubmissionIdSchema.validate(params)

      expect(error.details[0].message).toContain('"submissionId" is required')
    })

    it('should return an error if "submissionId" is not a number', () => {
      const params = { submissionId: 'abc' }
      const { error } = getBySubmissionIdSchema.validate(params)

      expect(error.details[0].message).toContain(
        '"submissionId" must be a number'
      )
    })
  })
})
