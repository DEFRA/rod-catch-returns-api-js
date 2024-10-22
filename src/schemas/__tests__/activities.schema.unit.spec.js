import { createActivitySchema } from '../activities.schema.js'
import { isActivityExists } from '../../services/activities.service.js'
import { isRiverInternal } from '../../services/rivers.service.js'
import { isSubmissionExists } from '../../services/submissions.service.js'

// Mock external service calls
jest.mock('../../services/activities.service.js')
jest.mock('../../services/rivers.service.js')
jest.mock('../../services/submissions.service.js')

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

    const getSuccessMocks = () => {
      isSubmissionExists.mockResolvedValue(true)
      isRiverInternal.mockResolvedValue(false)
      isActivityExists.mockResolvedValue(false)
    }

    it('should validate successfully when all fields are provided and valid', async () => {
      getSuccessMocks()
      const payload = getValidPayload()

      await expect(
        createActivitySchema.validateAsync(payload)
      ).resolves.toStrictEqual({
        daysFishedOther: 3,
        daysFishedWithMandatoryRelease: 5,
        river: 'rivers/456',
        submission: 'submissions/123'
      })
    })

    it('should return an error if "submission" is missing', async () => {
      getSuccessMocks()
      const payload = { ...getValidPayload(), submission: undefined }

      await expect(createActivitySchema.validateAsync(payload)).rejects.toThrow(
        '"submission" is required'
      )
    })

    it('should return an error if "daysFishedWithMandatoryRelease" is not a number', async () => {
      getSuccessMocks()
      const payload = {
        ...getValidPayload(),
        daysFishedWithMandatoryRelease: 'five'
      }

      await expect(createActivitySchema.validateAsync(payload)).rejects.toThrow(
        '"daysFishedWithMandatoryRelease" must be a number'
      )
    })

    it('should return an error if "daysFishedOther" is not a number', async () => {
      getSuccessMocks()
      const payload = { ...getValidPayload(), daysFishedOther: 'three' }

      await expect(createActivitySchema.validateAsync(payload)).rejects.toThrow(
        '"daysFishedOther" must be a number'
      )
    })

    it('should return an error if "river" is missing', async () => {
      getSuccessMocks()
      const payload = { ...getValidPayload(), river: undefined }

      await expect(createActivitySchema.validateAsync(payload)).rejects.toThrow(
        '"river" is required'
      )
    })

    it('should return an error if "submission" does not start with "submissions/"', async () => {
      getSuccessMocks()
      const payload = { ...getValidPayload(), submission: 'invalid/123' }

      await expect(createActivitySchema.validateAsync(payload)).rejects.toThrow(
        '"submission"'
      )
    })

    it('should return an error if "river" does not start with "rivers/"', async () => {
      getSuccessMocks()
      const payload = { ...getValidPayload(), river: 'invalid/456' }

      await expect(createActivitySchema.validateAsync(payload)).rejects.toThrow(
        '"river"'
      )
    })

    it('should return an error if "daysFishedWithMandatoryRelease" is negative', async () => {
      getSuccessMocks()
      const payload = {
        ...getValidPayload(),
        daysFishedWithMandatoryRelease: -1
      }

      await expect(createActivitySchema.validateAsync(payload)).rejects.toThrow(
        '"daysFishedWithMandatoryRelease" must be greater than or equal to 0'
      )
    })

    it('should return an error if "daysFishedOther" is negative', async () => {
      getSuccessMocks()
      const payload = { ...getValidPayload(), daysFishedOther: -1 }

      await expect(createActivitySchema.validateAsync(payload)).rejects.toThrow(
        '"daysFishedOther" must be greater than or equal to 0'
      )
    })

    it('should validate successfully when daysFishedWithMandatoryRelease is within the limit for a non-leap year', async () => {
      getSuccessMocks()
      mockCurrentYear(2023) // 2023 is not a leap year

      const payload = {
        ...getValidPayload(),
        daysFishedWithMandatoryRelease: 167
      }

      await expect(
        createActivitySchema.validateAsync(payload)
      ).resolves.toStrictEqual({
        daysFishedOther: 3,
        daysFishedWithMandatoryRelease: 167,
        river: 'rivers/456',
        submission: 'submissions/123'
      })
    })

    it('should return an error if daysFishedWithMandatoryRelease exceeds 167 for a non-leap year', async () => {
      getSuccessMocks()
      mockCurrentYear(2023) // 2023 is not a leap year

      const payload = {
        ...getValidPayload(),
        daysFishedWithMandatoryRelease: 168
      }

      await expect(createActivitySchema.validateAsync(payload)).rejects.toThrow(
        '"daysFishedWithMandatoryRelease" must be less than or equal to 167'
      )
    })

    it('should validate successfully when daysFishedWithMandatoryRelease is within the limit for a leap year', async () => {
      getSuccessMocks()
      mockCurrentYear(2024) // 2024 is a leap year
      const payload = {
        ...getValidPayload(),
        daysFishedWithMandatoryRelease: 168
      }

      await expect(
        createActivitySchema.validateAsync(payload)
      ).resolves.toStrictEqual({
        daysFishedOther: 3,
        daysFishedWithMandatoryRelease: 168,
        river: 'rivers/456',
        submission: 'submissions/123'
      })
    })

    it('should return an error if daysFishedWithMandatoryRelease exceeds 168 for a leap year', async () => {
      getSuccessMocks()
      mockCurrentYear(2024) // 2024 is a leap year
      const payload = {
        ...getValidPayload(),
        daysFishedWithMandatoryRelease: 169
      }

      await expect(createActivitySchema.validateAsync(payload)).rejects.toThrow(
        '"daysFishedWithMandatoryRelease" must be less than or equal to 168'
      )
    })

    it('should return an error if "daysFishedWithMandatoryRelease" is missing', async () => {
      getSuccessMocks()
      const payload = {
        ...getValidPayload(),
        daysFishedWithMandatoryRelease: undefined
      }

      await expect(createActivitySchema.validateAsync(payload)).rejects.toThrow(
        '"daysFishedWithMandatoryRelease" is required'
      )
    })

    it('should return an error if "daysFishedOther" is missing', async () => {
      getSuccessMocks()
      const payload = { ...getValidPayload(), daysFishedOther: undefined }

      await expect(createActivitySchema.validateAsync(payload)).rejects.toThrow(
        '"daysFishedOther" is required'
      )
    })

    it('should return an error if "daysFishedOther" is a non-integer number', async () => {
      getSuccessMocks()
      const payload = { ...getValidPayload(), daysFishedOther: 3.5 }

      await expect(createActivitySchema.validateAsync(payload)).rejects.toThrow(
        '"daysFishedOther" must be an integer'
      )
    })

    it('should return an error if "daysFishedWithMandatoryRelease" is a non-integer number', async () => {
      getSuccessMocks()
      const payload = {
        ...getValidPayload(),
        daysFishedWithMandatoryRelease: 1.5
      }

      await expect(createActivitySchema.validateAsync(payload)).rejects.toThrow(
        '"daysFishedWithMandatoryRelease" must be an integer'
      )
    })

    it('should return an error if submission does not exist', async () => {
      isSubmissionExists.mockResolvedValue(false)
      const payload = getValidPayload()

      await expect(createActivitySchema.validateAsync(payload)).rejects.toThrow(
        'The submission does not exist'
      )
    })

    it('should return an error if river is restricted', async () => {
      isSubmissionExists.mockResolvedValue(true)
      isRiverInternal.mockResolvedValue(true)
      const payload = getValidPayload()

      await expect(createActivitySchema.validateAsync(payload)).rejects.toThrow(
        'This river is restricted'
      )
    })

    it('should return an error if the activity already exists for the same submission and river', async () => {
      isSubmissionExists.mockResolvedValue(true)
      isRiverInternal.mockResolvedValue(false)
      isActivityExists.mockResolvedValue(true)

      const payload = getValidPayload()

      await expect(createActivitySchema.validateAsync(payload)).rejects.toThrow(
        'River duplicate found'
      )
    })
  })
})
