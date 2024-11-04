import { Activity } from '../../entities/index.js'
import { isActivityExists } from '../activities.service.js'

jest.mock('../../entities/index.js')

describe('activity.service.unit', () => {
  describe('isActivityExists', () => {
    const mockSubmissionId = 'abc123'
    const mockRiverId = 'abc123'

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return true if the activity exists', async () => {
      Activity.count.mockResolvedValue(1)

      const result = await isActivityExists(mockSubmissionId, mockRiverId)

      expect(result).toBe(true)
    })

    it('should return false if activity does not exist', async () => {
      Activity.count.mockResolvedValue(0)

      const result = await isActivityExists(mockSubmissionId, mockRiverId)

      expect(result).toBe(false)
    })

    it('should handle errors thrown by Activity.count', async () => {
      Activity.count.mockRejectedValue(new Error('Database error'))

      await expect(
        isActivityExists(mockSubmissionId, mockRiverId)
      ).rejects.toThrow('Database error')
    })
  })
})
