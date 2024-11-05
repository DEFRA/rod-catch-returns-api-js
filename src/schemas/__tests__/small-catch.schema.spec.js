import { createSmallCatchSchema } from '../small-catch.schema.js'
import { getMonthNameFromNumber } from '../../utils/date-utils.js'
import { getSubmissionByActivityId } from '../../services/activities.service.js'
import { isDuplicateSmallCatch } from '../../services/small-catch.service.js'

jest.mock('../../services/activities.service.js')
jest.mock('../../utils/entity-utils.js')
jest.mock('../../services/small-catch.service.js')

describe('smallCatch.schema.unit', () => {
  describe('createSmallCatchSchema', () => {
    afterEach(() => {
      jest.resetAllMocks()
    })

    const getValidPayload = () => ({
      activity: 'activities/123',
      released: 5,
      month: 'JANUARY',
      counts: [
        { method: 'methods/1', count: 1 },
        { method: 'methods/2', count: 2 }
      ],
      noMonthRecorded: false
    })

    const mockCurrentDate = new Date()
    const currentYear = mockCurrentDate.getFullYear()
    const currentMonth = mockCurrentDate.getMonth() + 1

    const setupMocks = ({ season }) => {
      getSubmissionByActivityId.mockResolvedValueOnce({ season })
    }

    it('should validate successfully when the submission season is current year and month is less than or equal to current month', async () => {
      // leaving month as JANUARY, it should always pass
      setupMocks({ season: currentYear })

      const payload = getValidPayload()

      await expect(
        createSmallCatchSchema.validateAsync(payload)
      ).resolves.toStrictEqual(payload)
    })

    it('should validate successfully when noMonthRecorded is undefined', async () => {
      // leaving month as JANUARY, it should always pass
      setupMocks({ season: currentYear })

      const payload = { ...getValidPayload(), noMonthRecorded: undefined }

      await expect(
        createSmallCatchSchema.validateAsync(payload)
      ).resolves.toStrictEqual(payload)
    })

    it('should return an error if the submission season is in the future', async () => {
      const futureYear = currentYear + 1
      setupMocks({ season: futureYear })
      const payload = getValidPayload()

      await expect(
        createSmallCatchSchema.validateAsync(payload)
      ).rejects.toThrow('Date must be before the current month and year')
    })

    it('should return an error if the submission season is current year and month is in the future', async () => {
      const futureMonth = currentMonth === 12 ? 1 : currentMonth + 1
      const futureSeason = currentMonth === 12 ? currentYear + 1 : currentYear

      setupMocks({ season: futureSeason })
      const payload = {
        ...getValidPayload(),
        month: getMonthNameFromNumber(futureMonth)
      }

      await expect(
        createSmallCatchSchema.validateAsync(payload)
      ).rejects.toThrow('Date must be before the current month and year')
    })

    it('should return an error if "activity" is missing', async () => {
      const payload = { ...getValidPayload(), activity: undefined }

      await expect(
        createSmallCatchSchema.validateAsync(payload)
      ).rejects.toThrow('ACTIVITY_REQUIRED')
    })

    it('should return an MONTH_REQUIRED if "month" is missing and noMonthRecorded is false', async () => {
      const payload = { ...getValidPayload(), month: undefined }

      await expect(
        createSmallCatchSchema.validateAsync(payload)
      ).rejects.toThrow('MONTH_REQUIRED')
    })

    it('should return a DEFAULT_MONTH_REQUIRED if "month" is missing and noMonthRecorded is true', async () => {
      const payload = {
        ...getValidPayload(),
        month: undefined,
        noMonthRecorded: true
      }

      await expect(
        createSmallCatchSchema.validateAsync(payload)
      ).rejects.toThrow('DEFAULT_MONTH_REQUIRED')
    })

    it('should return an error if "released" is missing', async () => {
      const payload = { ...getValidPayload(), released: undefined }

      await expect(
        createSmallCatchSchema.validateAsync(payload)
      ).rejects.toThrow('RELEASED_REQUIRED')
    })

    it('should return an error if "released" is a decimal number', async () => {
      const payload = { ...getValidPayload(), released: 5.5 }

      await expect(
        createSmallCatchSchema.validateAsync(payload)
      ).rejects.toThrow('RELEASED_INTEGER')
    })

    it('should return an error if "released" is a string', async () => {
      const payload = { ...getValidPayload(), released: 'five' }

      await expect(
        createSmallCatchSchema.validateAsync(payload)
      ).rejects.toThrow('RELEASED_NUMBER')
    })

    it('should return an error if "released" is negative', async () => {
      const payload = { ...getValidPayload(), released: -5 }

      await expect(
        createSmallCatchSchema.validateAsync(payload)
      ).rejects.toThrow('RELEASED_NEGATIVE')
    })

    it('should validate successfully if "released" is 0', async () => {
      setupMocks({ season: currentYear })
      const payload = { ...getValidPayload(), released: 0 }

      await expect(
        createSmallCatchSchema.validateAsync(payload)
      ).resolves.toStrictEqual(payload)
    })

    it('should validate successfully if "released" is a number as a string', async () => {
      setupMocks({ season: currentYear })
      const payload = { ...getValidPayload(), released: '3' }

      await expect(
        createSmallCatchSchema.validateAsync(payload)
      ).resolves.toStrictEqual({
        activity: 'activities/123',
        released: 3,
        counts: [
          { method: 'methods/1', count: 1 },
          { method: 'methods/2', count: 2 }
        ],
        month: 'JANUARY',
        noMonthRecorded: false
      })
    })

    it('should return DUPLICATE_FOUND error if a duplicate activity and month combination exists', async () => {
      setupMocks({ season: currentYear })
      isDuplicateSmallCatch.mockResolvedValue(true)

      const payload = getValidPayload()

      await expect(
        createSmallCatchSchema.validateAsync(payload)
      ).rejects.toThrow('DUPLICATE_FOUND')
    })

    describe('counts', () => {
      it('should return an error if counts is missing', async () => {
        const payload = { ...getValidPayload(), counts: undefined }
        await expect(
          createSmallCatchSchema.validateAsync(payload)
        ).rejects.toThrow('COUNTS_REQUIRED')
      })

      it('should return an error if counts is not an array', async () => {
        const payload = { ...getValidPayload(), counts: 'not-an-array' }
        await expect(
          createSmallCatchSchema.validateAsync(payload)
        ).rejects.toThrow('COUNTS_ARRAY')
      })

      it('should return an error if method is missing in counts item', async () => {
        const payload = { ...getValidPayload(), counts: [{ count: 1 }] }
        await expect(
          createSmallCatchSchema.validateAsync(payload)
        ).rejects.toThrow('METHOD_REQUIRED')
      })

      it('should return an error if count is missing in counts item', async () => {
        const payload = {
          ...getValidPayload(),
          counts: [{ method: 'methods/1' }]
        }
        await expect(
          createSmallCatchSchema.validateAsync(payload)
        ).rejects.toThrow('COUNT_REQUIRED')
      })

      it('should return an error if count is not a number', async () => {
        const payload = {
          ...getValidPayload(),
          counts: [{ method: 'methods/1', count: 'abc' }]
        }
        await expect(
          createSmallCatchSchema.validateAsync(payload)
        ).rejects.toThrow('COUNT_NUMBER')
      })

      it('should return an error if count is a decimal', async () => {
        const payload = {
          ...getValidPayload(),
          counts: [{ method: 'methods/1', count: 1.5 }]
        }
        await expect(
          createSmallCatchSchema.validateAsync(payload)
        ).rejects.toThrow('COUNT_INTEGER')
      })

      it('should return an error if count is negative', async () => {
        const payload = {
          ...getValidPayload(),
          counts: [{ method: 'methods/1', count: -1 }]
        }
        await expect(
          createSmallCatchSchema.validateAsync(payload)
        ).rejects.toThrow('COUNT_NEGATIVE')
      })

      it('should return an error if duplicate methods are present in counts', async () => {
        const payload = {
          ...getValidPayload(),
          counts: [
            { method: 'methods/1', count: 1 },
            { method: 'methods/1', count: 2 }
          ]
        }
        await expect(
          createSmallCatchSchema.validateAsync(payload)
        ).rejects.toThrow('COUNTS_METHOD_DUPLICATE_FOUND')
      })
    })
  })
})
