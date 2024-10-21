import { createActivitySchema } from '../activities.schema.js'

describe('activities.schema.unit', () => {
  describe('createActivitySchema', () => {
    const mockCurrentYear = (year) => {
      jest.useFakeTimers('modern')
      jest.useFakeTimers().setSystemTime(new Date(`${year}-01-01`))
    }

    afterEach(() => {
      jest.useRealTimers()
      jest.resetModules() // modules are reset to ensure date is mocked correctly
    })

    const getValidPayload = () => ({
      submission: 'submissions/123',
      daysFishedWithMandatoryRelease: 5,
      daysFishedOther: 3,
      river: 'rivers/456'
    })

    it('should validate successfully when all fields are provided and valid', () => {
      const payload = getValidPayload()

      const { error } = createActivitySchema.validate(payload)

      expect(error).toBeUndefined()
    })

    it('should return an error if "submission" is missing', () => {
      const payload = { ...getValidPayload(), submission: undefined }

      const { error } = createActivitySchema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('"submission" is required')
    })

    it('should return an error if "daysFishedWithMandatoryRelease" is not a number', () => {
      const payload = {
        ...getValidPayload(),
        daysFishedWithMandatoryRelease: 'five'
      }

      const { error } = createActivitySchema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain(
        '"daysFishedWithMandatoryRelease" must be a number'
      )
    })

    it('should return an error if "daysFishedOther" is not a number', () => {
      const payload = { ...getValidPayload(), daysFishedOther: 'three' }

      const { error } = createActivitySchema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain(
        '"daysFishedOther" must be a number'
      )
    })

    it('should return an error if "river" is missing', () => {
      const payload = { ...getValidPayload(), river: undefined }

      const { error } = createActivitySchema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('"river" is required')
    })

    it('should return an error if "submission" does not start with "submissions/"', () => {
      const payload = { ...getValidPayload(), submission: 'invalid/123' }

      const { error } = createActivitySchema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('"submission"')
    })

    it('should return an error if "river" does not start with "rivers/"', () => {
      const payload = { ...getValidPayload(), river: 'invalid/456' }

      const { error } = createActivitySchema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('"river"')
    })

    it('should return an error if "daysFishedWithMandatoryRelease" is negative', () => {
      const payload = {
        ...getValidPayload(),
        daysFishedWithMandatoryRelease: -1
      }

      const { error } = createActivitySchema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain(
        '"daysFishedWithMandatoryRelease" must be greater than or equal to 0'
      )
    })

    it('should return an error if "daysFishedOther" is negative', () => {
      const payload = { ...getValidPayload(), daysFishedOther: -1 }

      const { error } = createActivitySchema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain(
        '"daysFishedOther" must be greater than or equal to 0'
      )
    })

    it('should validate successfully when daysFishedWithMandatoryRelease is within the limit for a non-leap year', () => {
      mockCurrentYear(2023) // 2023 is not a leap year

      const payload = {
        ...getValidPayload(),
        daysFishedWithMandatoryRelease: 167
      }

      const { error } = createActivitySchema.validate(payload)

      expect(error).toBeUndefined()
    })

    it('should return an error if daysFishedWithMandatoryRelease exceeds 167 for a non-leap year', () => {
      mockCurrentYear(2023) // 2023 is not a leap year

      const payload = {
        ...getValidPayload(),
        daysFishedWithMandatoryRelease: 168
      }

      const { error } = createActivitySchema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain(
        '"daysFishedWithMandatoryRelease" must be less than or equal to 167'
      )
    })

    it('should validate successfully when daysFishedWithMandatoryRelease is within the limit for a leap year', () => {
      mockCurrentYear(2024) // 2024 is a leap year
      const payload = {
        ...getValidPayload(),
        daysFishedWithMandatoryRelease: 168
      }

      const { error } = createActivitySchema.validate(payload)

      expect(error).toBeUndefined()
    })

    it('should return an error if daysFishedWithMandatoryRelease exceeds 168 for a leap year', () => {
      mockCurrentYear(2024) // 2024 is a leap year
      const payload = {
        ...getValidPayload(),
        daysFishedWithMandatoryRelease: 169
      }

      const { error } = createActivitySchema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain(
        '"daysFishedWithMandatoryRelease" must be less than or equal to 168'
      )
    })
  })
})
