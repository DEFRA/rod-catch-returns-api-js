import { createSmallCatchSchema } from '../small-catch.schema.js'
import { getMonthNameFromNumber } from '../../utils/date-utils.js'
import { getSubmissionByActivityId } from '../../services/activities.service.js'

jest.mock('../../services/activities.service.js')
jest.mock('../../utils/entity-utils.js')

describe('smallCatch.schema.unit', () => {
  describe('createSmallCatchSchema', () => {
    afterEach(() => {
      jest.resetAllMocks()
    })

    const getValidPayload = () => ({
      activity: 'activities/123',
      month: 'JANUARY'
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
      ).rejects.toThrow('"activity" is required')
    })

    it('should return an error if "month" is missing', async () => {
      const payload = { ...getValidPayload(), month: undefined }

      await expect(
        createSmallCatchSchema.validateAsync(payload)
      ).rejects.toThrow('"month" is required')
    })
  })
})
