import {
  getSubmission,
  isSubmissionExists
} from '../../services/submissions.service.js'
import { createActivitySchema } from '../activities.schema.js'
import { isActivityExists } from '../../services/activities.service.js'
import { isRiverInternal } from '../../services/rivers.service.js'

jest.mock('../../services/activities.service.js')
jest.mock('../../services/rivers.service.js')
jest.mock('../../services/submissions.service.js')

describe('activities.schema.unit', () => {
  describe('createActivitySchema', () => {
    afterEach(() => {
      jest.resetAllMocks()
    })

    const getValidPayload = () => ({
      submission: 'submissions/123',
      daysFishedWithMandatoryRelease: 5,
      daysFishedOther: 3,
      river: 'rivers/456'
    })

    const setupMocks = ({
      season = 2024,
      submissionExists = true,
      riverInternal = false,
      activityExists = false
    } = {}) => {
      getSubmission.mockResolvedValue({ season })
      isSubmissionExists.mockResolvedValue(submissionExists)
      isRiverInternal.mockResolvedValue(riverInternal)
      isActivityExists.mockResolvedValue(activityExists)
    }

    it('should validate successfully when all fields are provided and valid', async () => {
      setupMocks()
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

    it('should return an error if the activity already exists for the same submission and river', async () => {
      setupMocks({ activityExists: true })
      const payload = getValidPayload()

      await expect(createActivitySchema.validateAsync(payload)).rejects.toThrow(
        'ACTIVITY_RIVER_DUPLICATE_FOUND'
      )
    })

    describe('submission', () => {
      it('should return an error if "submission" is missing', async () => {
        setupMocks()
        const payload = { ...getValidPayload(), submission: undefined }

        await expect(
          createActivitySchema.validateAsync(payload)
        ).rejects.toThrow('ACTIVITY_SUBMISSION_REQUIRED')
      })

      it('should return an error if "submission" is an empty string', async () => {
        setupMocks()
        const payload = { ...getValidPayload(), submission: '' }

        await expect(
          createActivitySchema.validateAsync(payload)
        ).rejects.toThrow('ACTIVITY_SUBMISSION_REQUIRED')
      })

      it('should return an error if "submission" does not start with "submissions/"', async () => {
        setupMocks()
        const payload = { ...getValidPayload(), submission: 'invalid/123' }

        await expect(
          createActivitySchema.validateAsync(payload)
        ).rejects.toThrow('ACTIVITY_SUBMISSION_PATTERN_INVALID')
      })

      it('should return an error if submission does not exist', async () => {
        isSubmissionExists.mockResolvedValue(false)
        const payload = getValidPayload()

        await expect(
          createActivitySchema.validateAsync(payload)
        ).rejects.toThrow('ACTIVITY_SUBMISSION_NOT_FOUND')
      })
    })

    describe('river', () => {
      it('should return an error if "river" is missing', async () => {
        setupMocks()
        const payload = { ...getValidPayload(), river: undefined }

        await expect(
          createActivitySchema.validateAsync(payload)
        ).rejects.toThrow('ACTIVITY_RIVER_REQUIRED')
      })

      it('should return an error if "river" is an empty string', async () => {
        setupMocks()
        const payload = { ...getValidPayload(), river: '' }

        await expect(
          createActivitySchema.validateAsync(payload)
        ).rejects.toThrow('ACTIVITY_RIVER_REQUIRED')
      })

      it('should return an error if "river" does not start with "rivers/"', async () => {
        setupMocks()
        const payload = { ...getValidPayload(), river: 'invalid/456' }

        await expect(
          createActivitySchema.validateAsync(payload)
        ).rejects.toThrow('ACTIVITY_RIVER_PATTERN_INVALID')
      })

      it('should return an error if river is restricted', async () => {
        setupMocks({ riverInternal: true })
        const payload = getValidPayload()

        await expect(
          createActivitySchema.validateAsync(payload)
        ).rejects.toThrow('ACTIVITY_RIVER_FORBIDDEN')
      })
    })

    describe('daysFishedWithMandatoryRelease', () => {
      it('should validate successfully if "daysFishedWithMandatoryRelease" is 0 and "daysFishedOther is more than 0', async () => {
        setupMocks()
        const payload = {
          ...getValidPayload(),
          daysFishedOther: 2,
          daysFishedWithMandatoryRelease: 0
        }

        await expect(
          createActivitySchema.validateAsync(payload)
        ).resolves.toStrictEqual({
          daysFishedOther: 2,
          daysFishedWithMandatoryRelease: 0,
          river: 'rivers/456',
          submission: 'submissions/123'
        })
      })

      it('should return an error if "daysFishedWithMandatoryRelease" is not a number', async () => {
        setupMocks()
        const payload = {
          ...getValidPayload(),
          daysFishedWithMandatoryRelease: 'five'
        }

        await expect(
          createActivitySchema.validateAsync(payload)
        ).rejects.toThrow(
          'ACTIVITY_DAYS_FISHED_WITH_MANDATORY_RELEASE_NOT_A_NUMBER'
        )
      })

      it('should return an error if "daysFishedWithMandatoryRelease" is negative', async () => {
        setupMocks()
        const payload = {
          ...getValidPayload(),
          daysFishedWithMandatoryRelease: -1
        }

        await expect(
          createActivitySchema.validateAsync(payload)
        ).rejects.toThrow(
          'ACTIVITY_DAYS_FISHED_WITH_MANDATORY_RELEASE_NEGATIVE'
        )
      })

      it('should validate successfully when daysFishedWithMandatoryRelease is within the limit for a non-leap year', async () => {
        setupMocks({ season: 2023 }) // 2023 is not a leap year

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
        setupMocks({ season: 2023 }) // 2023 is not a leap year
        const payload = {
          ...getValidPayload(),
          daysFishedWithMandatoryRelease: 168
        }

        await expect(
          createActivitySchema.validateAsync(payload)
        ).rejects.toThrow(
          'ACTIVITY_DAYS_FISHED_WITH_MANDATORY_RELEASE_MAX_EXCEEDED'
        )
      })

      it('should validate successfully when daysFishedWithMandatoryRelease is within the limit for a leap year', async () => {
        setupMocks({ season: 2024 }) // 2024 is a leap year

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
        setupMocks({ season: 2024 }) // 2024 is a leap year

        const payload = {
          ...getValidPayload(),
          daysFishedWithMandatoryRelease: 169
        }

        await expect(
          createActivitySchema.validateAsync(payload)
        ).rejects.toThrow(
          'ACTIVITY_DAYS_FISHED_WITH_MANDATORY_RELEASE_MAX_EXCEEDED'
        )
      })

      it('should return an error if "daysFishedWithMandatoryRelease" is missing', async () => {
        setupMocks()
        const payload = {
          ...getValidPayload(),
          daysFishedWithMandatoryRelease: undefined
        }

        await expect(
          createActivitySchema.validateAsync(payload)
        ).rejects.toThrow(
          'ACTIVITY_DAYS_FISHED_WITH_MANDATORY_RELEASE_REQUIRED'
        )
      })

      it('should return an error if "daysFishedWithMandatoryRelease" is a non-integer number', async () => {
        setupMocks()
        const payload = {
          ...getValidPayload(),
          daysFishedWithMandatoryRelease: 1.5
        }

        await expect(
          createActivitySchema.validateAsync(payload)
        ).rejects.toThrow('ACTIVITY_DAYS_FISHED_WITH_MANDATORY_NOT_AN_INTEGER')
      })
    })

    describe('daysFishedOther', () => {
      it('should validate successfully if "daysFishedOther" is 0 and "daysFishedWithMandatoryRelease is more than 0', async () => {
        setupMocks()
        const payload = {
          ...getValidPayload(),
          daysFishedOther: 0,
          daysFishedWithMandatoryRelease: 3
        }

        await expect(
          createActivitySchema.validateAsync(payload)
        ).resolves.toStrictEqual({
          daysFishedOther: 0,
          daysFishedWithMandatoryRelease: 3,
          river: 'rivers/456',
          submission: 'submissions/123'
        })
      })

      it('should return an error if "daysFishedOther" is not a number', async () => {
        setupMocks()
        const payload = { ...getValidPayload(), daysFishedOther: 'three' }

        await expect(
          createActivitySchema.validateAsync(payload)
        ).rejects.toThrow('ACTIVITY_DAYS_FISHED_OTHER_NOT_A_NUMBER')
      })

      it('should return an error if "daysFishedOther" is negative', async () => {
        setupMocks()
        const payload = { ...getValidPayload(), daysFishedOther: -1 }

        await expect(
          createActivitySchema.validateAsync(payload)
        ).rejects.toThrow('ACTIVITY_DAYS_FISHED_OTHER_NEGATIVE')
      })

      it('should return an error if "daysFishedOther" is missing', async () => {
        setupMocks()
        const payload = { ...getValidPayload(), daysFishedOther: undefined }

        await expect(
          createActivitySchema.validateAsync(payload)
        ).rejects.toThrow('ACTIVITY_DAYS_FISHED_OTHER_REQUIRED')
      })

      it('should return an error if "daysFishedOther" is a non-integer number', async () => {
        setupMocks()
        const payload = { ...getValidPayload(), daysFishedOther: 3.5 }

        await expect(
          createActivitySchema.validateAsync(payload)
        ).rejects.toThrow('ACTIVITY_DAYS_FISHED_OTHER_NOT_AN_INTEGER')
      })

      it('should return an error if "daysFishedWithMandatoryRelease" is 0 and "daysFishedOther" is 0', async () => {
        setupMocks()
        const payload = {
          ...getValidPayload(),
          daysFishedWithMandatoryRelease: 0,
          daysFishedOther: 0
        }

        await expect(
          createActivitySchema.validateAsync(payload)
        ).rejects.toThrow('ACTIVITY_DAYS_FISHED_NOT_GREATER_THAN_ZERO')
      })
    })
  })
})
