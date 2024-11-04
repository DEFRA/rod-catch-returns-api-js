import {
  getSubmissionByActivityId,
  isActivityExists
} from '../activities.service.js'
import { Activity } from '../../entities/index.js'

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

  describe('getSubmissionByActivityId', () => {
    const mockActivityId = 123

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return the submission if the activity with submission exists', async () => {
      const mockSubmission = { id: 'submission-456' }
      Activity.findOne.mockResolvedValue({ Submission: mockSubmission })

      const result = await getSubmissionByActivityId(mockActivityId)

      expect(result).toBe(mockSubmission)
    })

    it('should throw an error if no submission is found for the activity ID', async () => {
      Activity.findOne.mockResolvedValue(null)

      await expect(getSubmissionByActivityId(mockActivityId)).rejects.toThrow(
        `No submission found for activity ID ${mockActivityId}`
      )
    })

    it('should throw an error if Activity.findOne fails', async () => {
      Activity.findOne.mockRejectedValue(new Error('Database error'))

      await expect(getSubmissionByActivityId(mockActivityId)).rejects.toThrow(
        `Failed to fetch submission for activity ID ${mockActivityId}: Error: Database error`
      )
    })
  })
})
