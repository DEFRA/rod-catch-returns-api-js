import {
  createSmallCatchSchema,
  updateSmallCatchActivityIdSchema,
  updateSmallCatchSchema
} from '../small-catch.schema.js'
import {
  getSmallCatchById,
  getTotalSmallCatchCountsBySmallCatchId,
  isDuplicateSmallCatch
} from '../../services/small-catch.service.js'
import { getMonthNameFromNumber } from '../../utils/date-utils.js'
import { getSubmissionByActivityId } from '../../services/activities.service.js'
import { isFMTOrAdmin } from '../../utils/auth-utils.js'
import { isMethodsInternal } from '../../services/methods.service.js'

jest.mock('../../services/activities.service.js')
jest.mock('../../services/small-catch.service.js')
jest.mock('../../services/methods.service.js')
jest.mock('../../utils/auth-utils.js')

describe('smallCatch.schema.unit', () => {
  const mockCurrentDate = new Date()
  const currentYear = mockCurrentDate.getFullYear()
  const currentMonth = mockCurrentDate.getMonth() + 1

  describe('createSmallCatchSchema', () => {
    afterEach(() => {
      jest.resetAllMocks()
    })

    const getValidPayload = (overrides = {}) => ({
      activity: 'activities/123',
      released: 1,
      month: 'JANUARY',
      counts: [
        { method: 'methods/1', count: 1 },
        { method: 'methods/2', count: 2 }
      ],
      noMonthRecorded: false,
      ...overrides
    })

    const setupMocks = ({
      season = 2024,
      methodsInternal = false,
      fmtOrAdmin = false
    } = {}) => {
      getSubmissionByActivityId.mockResolvedValueOnce({ season })
      isMethodsInternal.mockResolvedValueOnce(methodsInternal)
      isFMTOrAdmin.mockReturnValueOnce(fmtOrAdmin)
    }

    it('should validate successfully when the submission season is the current year and the month is less than or equal to the current month', async () => {
      // leaving month as JANUARY, it should always pass regardless of when it is run
      setupMocks({ season: currentYear })

      const payload = getValidPayload()

      await expect(
        createSmallCatchSchema.validateAsync(payload)
      ).resolves.toStrictEqual(payload)
    })

    it('should validate successfully when released is the same as the number in the count', async () => {
      setupMocks({ season: currentYear })

      const payload = getValidPayload({
        counts: [
          { method: 'methods/1', count: 2 },
          { method: 'methods/2', count: 3 }
        ],
        released: 5 // Matches total caught (3 + 2 = 5)}),
      })

      await expect(
        createSmallCatchSchema.validateAsync(payload)
      ).resolves.toStrictEqual(payload)
    })

    it('should validate successfully when noMonthRecorded is undefined', async () => {
      // leaving month as JANUARY, it should always pass regardless of when it is run
      setupMocks({ season: currentYear })

      const payload = getValidPayload({ noMonthRecorded: undefined })

      await expect(
        createSmallCatchSchema.validateAsync(payload)
      ).resolves.toStrictEqual(payload)
    })

    it('should validate successfully when additional parameters (that are not part of the schema) are passed in', async () => {
      setupMocks({ season: currentYear })

      const payload = getValidPayload({ submission: 'submission/123' })

      await expect(
        createSmallCatchSchema.validateAsync(payload)
      ).resolves.toStrictEqual(payload)
    })

    describe('activity', () => {
      it('should return an error if "activity" is missing', async () => {
        const payload = getValidPayload({ activity: undefined })

        await expect(
          createSmallCatchSchema.validateAsync(payload)
        ).rejects.toThrow('SMALL_CATCH_ACTIVITY_REQUIRED')
      })

      it('should return SMALL_CATCH_DUPLICATE_FOUND error if a duplicate activity and month combination exists', async () => {
        setupMocks({ season: currentYear })
        isDuplicateSmallCatch.mockResolvedValue(true)

        const payload = getValidPayload()

        await expect(
          createSmallCatchSchema.validateAsync(payload)
        ).rejects.toThrow('SMALL_CATCH_DUPLICATE_FOUND')
      })
    })

    describe('month', () => {
      it('should return an error if the submission season is in the future', async () => {
        const futureYear = currentYear + 1
        setupMocks({ season: futureYear })
        const payload = getValidPayload()

        await expect(
          createSmallCatchSchema.validateAsync(payload)
        ).rejects.toThrow('SMALL_CATCH_MONTH_IN_FUTURE')
      })

      it('should return an error if the submission season is current year and month is in the future', async () => {
        const futureMonth = currentMonth === 12 ? 1 : currentMonth + 1
        const futureSeason = currentMonth === 12 ? currentYear + 1 : currentYear

        setupMocks({ season: futureSeason })
        const payload = getValidPayload({
          month: getMonthNameFromNumber(futureMonth)
        })

        await expect(
          createSmallCatchSchema.validateAsync(payload)
        ).rejects.toThrow('SMALL_CATCH_MONTH_IN_FUTURE')
      })

      it('should return SMALL_CATCH_MONTH_REQUIRED if "month" is missing and noMonthRecorded is false', async () => {
        const payload = getValidPayload({
          month: undefined,
          noMonthRecorded: false
        })

        await expect(
          createSmallCatchSchema.validateAsync(payload)
        ).rejects.toThrow('SMALL_CATCH_MONTH_REQUIRED')
      })

      it('should return SMALL_CATCH_DEFAULT_MONTH_REQUIRED if "month" is missing and noMonthRecorded is true', async () => {
        const payload = getValidPayload({
          month: undefined,
          noMonthRecorded: true
        })

        await expect(
          createSmallCatchSchema.validateAsync(payload)
        ).rejects.toThrow('SMALL_CATCH_DEFAULT_MONTH_REQUIRED')
      })

      it('should return SMALL_CATCH_MONTH_REQUIRED error if "month" is null', async () => {
        const payload = getValidPayload({
          month: null
        })
        await expect(
          createSmallCatchSchema.validateAsync(payload)
        ).rejects.toThrow('SMALL_CATCH_MONTH_REQUIRED')
      })
    })

    describe('released', () => {
      it('should return an error if "released" is missing', async () => {
        const payload = getValidPayload({ released: undefined })

        await expect(
          createSmallCatchSchema.validateAsync(payload)
        ).rejects.toThrow('SMALL_CATCH_RELEASED_REQUIRED')
      })

      it('should return an error if "released" is a decimal number', async () => {
        const payload = getValidPayload({ released: 5.5 })

        await expect(
          createSmallCatchSchema.validateAsync(payload)
        ).rejects.toThrow('SMALL_CATCH_RELEASED_INTEGER')
      })

      it('should return an error if "released" is a string', async () => {
        const payload = getValidPayload({ released: 'five' })

        await expect(
          createSmallCatchSchema.validateAsync(payload)
        ).rejects.toThrow('SMALL_CATCH_RELEASED_NUMBER')
      })

      it('should return an error if "released" is negative', async () => {
        const payload = getValidPayload({ released: -5 })

        await expect(
          createSmallCatchSchema.validateAsync(payload)
        ).rejects.toThrow('SMALL_CATCH_RELEASED_NEGATIVE')
      })

      it('should validate successfully if "released" is 0', async () => {
        setupMocks({ season: currentYear })
        const payload = getValidPayload({ released: 0 })

        await expect(
          createSmallCatchSchema.validateAsync(payload)
        ).resolves.toStrictEqual(payload)
      })

      it('should validate successfully if "released" is a number as a string', async () => {
        setupMocks({ season: currentYear })
        const payload = getValidPayload({ released: '3' })

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

      it('should return an error if released exceeds the sum of counts', async () => {
        const payload = getValidPayload({
          counts: [
            { method: 'methods/1', count: 3 },
            { method: 'methods/2', count: 2 }
          ],
          released: 6 // Exceeds total caught (3 + 2 = 5)
        })

        await expect(
          createSmallCatchSchema.validateAsync(payload)
        ).rejects.toThrow('SMALL_CATCH_RELEASED_EXCEEDS_COUNTS')
      })
    })

    describe('counts', () => {
      it('should return an error if counts is missing', async () => {
        const payload = getValidPayload({ counts: undefined })
        await expect(
          createSmallCatchSchema.validateAsync(payload)
        ).rejects.toThrow('SMALL_CATCH_COUNTS_REQUIRED')
      })

      it('should return an error if counts is an empty array', async () => {
        const payload = getValidPayload({ counts: [] })
        await expect(
          createSmallCatchSchema.validateAsync(payload)
        ).rejects.toThrow('SMALL_CATCH_COUNTS_REQUIRED')
      })

      it('should return an error if counts is not an array', async () => {
        const payload = getValidPayload({ counts: 'not-an-array' })
        await expect(
          createSmallCatchSchema.validateAsync(payload)
        ).rejects.toThrow('SMALL_CATCH_COUNTS_REQUIRED')
      })

      it('should return an error if method is missing in counts item', async () => {
        const payload = getValidPayload({ counts: [{ count: 1 }] })
        await expect(
          createSmallCatchSchema.validateAsync(payload)
        ).rejects.toThrow('SMALL_CATCH_COUNTS_METHOD_REQUIRED')
      })

      it('should return an error if count is missing in counts item', async () => {
        const payload = getValidPayload({ counts: [{ method: 'methods/1' }] })

        await expect(
          createSmallCatchSchema.validateAsync(payload)
        ).rejects.toThrow('SMALL_CATCH_COUNTS_COUNT_REQUIRED')
      })

      it('should return an error if count is not a number', async () => {
        const payload = getValidPayload({
          counts: [{ method: 'methods/1', count: 'abc' }]
        })

        await expect(
          createSmallCatchSchema.validateAsync(payload)
        ).rejects.toThrow('SMALL_CATCH_COUNTS_COUNT_NUMBER')
      })

      it('should return an error if count is a decimal', async () => {
        const payload = getValidPayload({
          counts: [{ method: 'methods/1', count: 1.5 }]
        })

        await expect(
          createSmallCatchSchema.validateAsync(payload)
        ).rejects.toThrow('SMALL_CATCH_COUNTS_COUNT_INTEGER')
      })

      it('should return an error if count is negative', async () => {
        const payload = getValidPayload({
          counts: [{ method: 'methods/1', count: -1 }]
        })

        await expect(
          createSmallCatchSchema.validateAsync(payload)
        ).rejects.toThrow('SMALL_CATCH_COUNTS_NOT_GREATER_THAN_ZERO')
      })

      it('should return an error if duplicate methods are present in counts', async () => {
        const payload = getValidPayload({
          counts: [
            { method: 'methods/1', count: 1 },
            { method: 'methods/1', count: 2 }
          ]
        })

        await expect(
          createSmallCatchSchema.validateAsync(payload)
        ).rejects.toThrow('SMALL_CATCH_COUNTS_METHOD_DUPLICATE_FOUND')
      })

      it('should return an error if any of the methods are restricted and the user is not an admin or fmt', async () => {
        setupMocks({ methodsInternal: true })
        const payload = getValidPayload({
          counts: [{ method: 'methods/4', count: 1 }]
        })

        await expect(
          createSmallCatchSchema.validateAsync(payload)
        ).rejects.toThrow('SMALL_CATCH_COUNTS_METHOD_FORBIDDEN')
      })

      it('should validate successfully if any of the methods are restricted and the user is an admin or fmt', async () => {
        setupMocks({ methodsInternal: true, fmtOrAdmin: true })
        const payload = getValidPayload({
          counts: [{ method: 'methods/4', count: 1 }]
        })

        await expect(
          createSmallCatchSchema.validateAsync(payload)
        ).resolves.toStrictEqual(payload)
      })
    })

    describe('reportingExclude', () => {
      it.each([undefined, true, false])(
        'should successfully validate if "reportingExclude" is %s',
        async (value) => {
          setupMocks()
          const payload = getValidPayload({ reportingExclude: value })

          await expect(
            createSmallCatchSchema.validateAsync(payload)
          ).resolves.toStrictEqual(payload)
        }
      )

      it('should return an error if "reportingExclude" is invalid', async () => {
        const payload = getValidPayload({ reportingExclude: 'test' })

        await expect(
          createSmallCatchSchema.validateAsync(payload)
        ).rejects.toThrow('SMALL_CATCH_REPORTING_EXCLUDE_INVALID')
      })
    })

    describe('noMonthRecorded', () => {
      it.each([undefined, true, false])(
        'should successfully validate if "noMonthRecorded" is %s',
        async (value) => {
          setupMocks()
          const payload = getValidPayload({ noMonthRecorded: value })

          await expect(
            createSmallCatchSchema.validateAsync(payload)
          ).resolves.toStrictEqual(payload)
        }
      )

      it('should return an error if "noMonthRecorded" is invalid', async () => {
        const payload = getValidPayload({ noMonthRecorded: 'test' })

        await expect(
          createSmallCatchSchema.validateAsync(payload)
        ).rejects.toThrow('SMALL_CATCH_NO_MONTH_RECORDED_INVALID')
      })
    })
  })

  describe('updateSmallCatchSchema', () => {
    afterEach(() => {
      jest.resetAllMocks()
    })

    const getValidPayload = (overrides = {}) => ({
      released: 1,
      month: 'JANUARY',
      counts: [
        { method: 'methods/1', count: 1 },
        { method: 'methods/2', count: 2 }
      ],
      noMonthRecorded: false,
      ...overrides
    })

    const setupMocks = ({
      season = 2024,
      activityId = '123',
      month = 1,
      released = 1,
      methodsInternal = false,
      fmtOrAdmin = false
    } = {}) => {
      getSubmissionByActivityId.mockResolvedValueOnce({ season })
      getSmallCatchById.mockResolvedValue({
        activity_id: activityId,
        month,
        released
      })
      isMethodsInternal.mockResolvedValueOnce(methodsInternal)
      isFMTOrAdmin.mockReturnValue(fmtOrAdmin)
    }

    const getDefaultContext = () => ({
      context: {
        params: {
          smallCatchId: '12345'
        }
      }
    })

    describe('month', () => {
      it('should validate successfully if "month" is missing', async () => {
        setupMocks()

        const payload = getValidPayload({ month: undefined })

        await expect(
          updateSmallCatchSchema.validateAsync(payload, getDefaultContext())
        ).resolves.toStrictEqual(payload)
      })

      it('should validate successfully if "month" is valid', async () => {
        setupMocks()
        getTotalSmallCatchCountsBySmallCatchId.mockResolvedValueOnce(1)
        const payload = { month: 'JANUARY' }

        await expect(
          updateSmallCatchSchema.validateAsync(payload, getDefaultContext())
        ).resolves.toStrictEqual(payload)
      })

      it('should return SMALL_CATCH_MONTH_REQUIRED error if "month" is null', async () => {
        setupMocks()
        const payload = { month: null }

        await expect(
          updateSmallCatchSchema.validateAsync(payload, getDefaultContext())
        ).rejects.toThrow('SMALL_CATCH_MONTH_REQUIRED')
      })

      it('should return SMALL_CATCH_MONTH_IN_FUTURE error if the submission season is in the future', async () => {
        const futureYear = currentYear + 1
        setupMocks({ season: futureYear })
        const payload = { month: 'JANUARY' }

        await expect(
          updateSmallCatchSchema.validateAsync(payload, getDefaultContext())
        ).rejects.toThrow('SMALL_CATCH_MONTH_IN_FUTURE')
      })

      it('should return SMALL_CATCH_DUPLICATE_FOUND error if a duplicate activity and month combination exists', async () => {
        setupMocks({ season: currentYear })
        isDuplicateSmallCatch.mockResolvedValue(true)

        const payload = { month: 'JANUARY' }

        await expect(
          updateSmallCatchSchema.validateAsync(payload, getDefaultContext())
        ).rejects.toThrow('SMALL_CATCH_DUPLICATE_FOUND')
      })
    })

    describe('released', () => {
      it('should validate successfully if "released" is missing', async () => {
        setupMocks()
        const payload = getValidPayload({ released: undefined })

        await expect(
          updateSmallCatchSchema.validateAsync(payload, getDefaultContext())
        ).resolves.toStrictEqual(payload)
      })

      it('should validate successfully if "released" is valid', async () => {
        setupMocks()
        const payload = {
          released: 2,
          counts: [{ method: 'methods/1', count: 2 }]
        }

        await expect(
          updateSmallCatchSchema.validateAsync(payload, getDefaultContext())
        ).resolves.toStrictEqual(payload)
      })

      it('should return an error if "released" is a decimal number', async () => {
        setupMocks()
        const payload = { released: 5.5 }

        await expect(
          updateSmallCatchSchema.validateAsync(payload, getDefaultContext())
        ).rejects.toThrow('SMALL_CATCH_RELEASED_INTEGER')
      })

      it('should return an error if "released" is a string', async () => {
        const payload = { released: 'five' }

        await expect(
          updateSmallCatchSchema.validateAsync(payload, getDefaultContext())
        ).rejects.toThrow('SMALL_CATCH_RELEASED_NUMBER')
      })

      it('should return an error if "released" is negative', async () => {
        const payload = { released: -5 }

        await expect(
          updateSmallCatchSchema.validateAsync(payload, getDefaultContext())
        ).rejects.toThrow('SMALL_CATCH_RELEASED_NEGATIVE')
      })

      it('should validate successfully if "released" is 0', async () => {
        setupMocks()
        const payload = {
          released: 0,
          counts: [{ method: 'methods/1', count: 2 }]
        }

        await expect(
          updateSmallCatchSchema.validateAsync(payload, getDefaultContext())
        ).resolves.toStrictEqual(payload)
      })

      it('should return an error if released exceeds the sum of counts in the request', async () => {
        setupMocks()
        const payload = {
          counts: [
            { method: 'methods/1', count: 3 },
            { method: 'methods/2', count: 2 }
          ],
          released: 6 // Exceeds total caught (3 + 2 = 5)
        }

        await expect(
          updateSmallCatchSchema.validateAsync(payload, getDefaultContext())
        ).rejects.toThrow('SMALL_CATCH_RELEASED_EXCEEDS_COUNTS')
      })

      it('should return an error if released exceeds the sum of counts from the database', async () => {
        setupMocks()
        getTotalSmallCatchCountsBySmallCatchId.mockResolvedValueOnce(5)
        const payload = {
          released: 6
        }

        await expect(
          updateSmallCatchSchema.validateAsync(payload, getDefaultContext())
        ).rejects.toThrow('SMALL_CATCH_RELEASED_EXCEEDS_COUNTS')
      })

      it('should return an error the sum of the counts from the database returns undefined', async () => {
        setupMocks()
        getTotalSmallCatchCountsBySmallCatchId.mockResolvedValueOnce(undefined)
        const payload = {
          released: 6
        }

        await expect(
          updateSmallCatchSchema.validateAsync(payload, getDefaultContext())
        ).rejects.toThrow('SMALL_CATCH_RELEASED_EXCEEDS_COUNTS')
      })
    })

    describe('counts', () => {
      it('should validate successfully if "counts" is missing', async () => {
        setupMocks()
        getTotalSmallCatchCountsBySmallCatchId.mockResolvedValueOnce(1)
        const payload = getValidPayload({ counts: undefined })

        await expect(
          updateSmallCatchSchema.validateAsync(payload, getDefaultContext())
        ).resolves.toStrictEqual(payload)
      })

      it('should return an error if "counts" is an empty array', async () => {
        const payload = { counts: [] }

        await expect(
          updateSmallCatchSchema.validateAsync(payload, getDefaultContext())
        ).rejects.toThrow('SMALL_CATCH_COUNTS_REQUIRED')
      })

      it('should return an error if "counts" is not an array', async () => {
        const payload = { counts: 'not-an-array' }

        await expect(
          updateSmallCatchSchema.validateAsync(payload, getDefaultContext())
        ).rejects.toThrow('SMALL_CATCH_COUNTS_REQUIRED')
      })

      it('should return an error if method is missing in counts item', async () => {
        const payload = { counts: [{ count: 1 }] }
        await expect(
          updateSmallCatchSchema.validateAsync(payload, getDefaultContext())
        ).rejects.toThrow('SMALL_CATCH_COUNTS_METHOD_REQUIRED')
      })

      it('should return an error if count is missing in counts item', async () => {
        const payload = { counts: [{ method: 'methods/1' }] }

        await expect(
          updateSmallCatchSchema.validateAsync(payload, getDefaultContext())
        ).rejects.toThrow('SMALL_CATCH_COUNTS_COUNT_REQUIRED')
      })

      it('should return an error if count is not a number', async () => {
        const payload = {
          counts: [{ method: 'methods/1', count: 'abc' }]
        }

        await expect(
          updateSmallCatchSchema.validateAsync(payload, getDefaultContext())
        ).rejects.toThrow('SMALL_CATCH_COUNTS_COUNT_NUMBER')
      })

      it('should return an error if count is a decimal', async () => {
        const payload = {
          counts: [{ method: 'methods/1', count: 1.5 }]
        }

        await expect(
          updateSmallCatchSchema.validateAsync(payload, getDefaultContext())
        ).rejects.toThrow('SMALL_CATCH_COUNTS_COUNT_INTEGER')
      })

      it('should return an error if count is negative', async () => {
        const payload = {
          counts: [{ method: 'methods/1', count: -1 }]
        }

        await expect(
          updateSmallCatchSchema.validateAsync(payload, getDefaultContext())
        ).rejects.toThrow('SMALL_CATCH_COUNTS_NOT_GREATER_THAN_ZERO')
      })

      it('should return an error if duplicate methods are present in counts', async () => {
        const payload = {
          counts: [
            { method: 'methods/1', count: 1 },
            { method: 'methods/1', count: 2 }
          ]
        }

        await expect(
          updateSmallCatchSchema.validateAsync(payload, getDefaultContext())
        ).rejects.toThrow('SMALL_CATCH_COUNTS_METHOD_DUPLICATE_FOUND')
      })

      it('should return SMALL_CATCH_RELEASED_EXCEEDS_COUNTS error if the total "counts" entered is less than the "released" in the database', async () => {
        setupMocks({ released: 5 })
        const payload = {
          counts: [
            { method: 'methods/1', count: 1 },
            { method: 'methods/2', count: 2 }
          ]
        }

        await expect(
          updateSmallCatchSchema.validateAsync(payload, getDefaultContext())
        ).rejects.toThrow('SMALL_CATCH_RELEASED_EXCEEDS_COUNTS')
      })

      it('should return an error if any of the methods are restricted and the user is not an admin or fmt', async () => {
        setupMocks({ methodsInternal: true })
        const payload = {
          counts: [{ method: 'methods/4', count: 1 }]
        }

        await expect(
          updateSmallCatchSchema.validateAsync(payload, getDefaultContext())
        ).rejects.toThrow('SMALL_CATCH_COUNTS_METHOD_FORBIDDEN')
      })

      it('should validate successfully if any of the methods are restricted and the user is an admin or fmt', async () => {
        setupMocks({ methodsInternal: true, fmtOrAdmin: true })
        const payload = {
          counts: [{ method: 'methods/4', count: 1 }]
        }

        await expect(
          updateSmallCatchSchema.validateAsync(payload, getDefaultContext())
        ).resolves.toStrictEqual(payload)
      })
    })

    describe('reportingExclude', () => {
      it.each([undefined, true, false])(
        'should successfully validate if "reportingExclude" is %s',
        async (value) => {
          setupMocks()
          getTotalSmallCatchCountsBySmallCatchId.mockResolvedValueOnce(1)
          const payload = { reportingExclude: value }

          await expect(
            updateSmallCatchSchema.validateAsync(payload, getDefaultContext())
          ).resolves.toStrictEqual(payload)
        }
      )

      it('should return an error if "reportingExclude" is invalid', async () => {
        setupMocks()
        getTotalSmallCatchCountsBySmallCatchId.mockResolvedValueOnce(1)
        const payload = { reportingExclude: 'test' }

        await expect(
          updateSmallCatchSchema.validateAsync(payload, getDefaultContext())
        ).rejects.toThrow('SMALL_CATCH_REPORTING_EXCLUDE_INVALID')
      })
    })

    describe('noMonthRecorded', () => {
      it.each([undefined, true, false])(
        'should successfully validate if "noMonthRecorded" is %s',
        async (value) => {
          setupMocks()
          getTotalSmallCatchCountsBySmallCatchId.mockResolvedValueOnce(1)
          const payload = { noMonthRecorded: value }

          await expect(
            updateSmallCatchSchema.validateAsync(payload, getDefaultContext())
          ).resolves.toStrictEqual(payload)
        }
      )

      it('should return an error if "noMonthRecorded" is invalid', async () => {
        setupMocks()
        getTotalSmallCatchCountsBySmallCatchId.mockResolvedValueOnce(1)
        const payload = { noMonthRecorded: 'test' }

        await expect(
          updateSmallCatchSchema.validateAsync(payload, getDefaultContext())
        ).rejects.toThrow('SMALL_CATCH_NO_MONTH_RECORDED_INVALID')
      })
    })
  })

  describe('updateSmallCatchActivityIdSchema', () => {
    it('should validate successfully if activity is valid', async () => {
      const activity = 'activities/101'
      await expect(
        updateSmallCatchActivityIdSchema.validateAsync(activity)
      ).resolves.toStrictEqual(activity)
    })

    it('should return an error if "activity" is missing', async () => {
      await expect(
        updateSmallCatchActivityIdSchema.validateAsync(undefined)
      ).rejects.toThrow('SMALL_CATCH_ACTIVITY_REQUIRED')
    })

    it('should return an error if "activity" does not start with "activities/"', async () => {
      await expect(
        updateSmallCatchActivityIdSchema.validateAsync('invalid/123')
      ).rejects.toThrow('SMALL_CATCH_ACTIVITY_INVALID')
    })

    it('should return an error if "activity" does not end in a number', async () => {
      await expect(
        updateSmallCatchActivityIdSchema.validateAsync('activities/abc')
      ).rejects.toThrow('SMALL_CATCH_ACTIVITY_INVALID')
    })
  })
})
