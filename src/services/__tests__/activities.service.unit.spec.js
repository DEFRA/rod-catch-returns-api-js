import {
  getSubmissionByActivityId,
  isActivityExists
} from '../activities.service.js'
import { Activity } from '../../entities/index.js'
import { Op } from 'sequelize'

jest.mock('../../entities/index.js')

describe('activity.service.unit', () => {
  describe('isActivityExists', () => {
    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return true if the activity exists and no activityId is provided', async () => {
      Activity.count.mockResolvedValue(1)

      const result = await isActivityExists('3', '4')

      expect(result).toBe(true)
    })

    it('should return false if activity does not exist and no activityId is provided', async () => {
      Activity.count.mockResolvedValue(0)

      const result = await isActivityExists('3', '4')

      expect(result).toBe(false)
    })

    it('should handle errors thrown by Activity.count', async () => {
      Activity.count.mockRejectedValue(new Error('Database error'))

      await expect(isActivityExists('3', '4')).rejects.toThrow('Database error')
    })

    it('should have a where clause with only the submission and river id if no activityId is provided', async () => {
      const mockSubmissionId = '3'
      const mockRiverId = '4'
      Activity.count.mockResolvedValue(1)

      await isActivityExists(mockSubmissionId, mockRiverId)

      expect(Activity.count).toHaveBeenCalledWith({
        where: {
          submission_id: mockSubmissionId,
          river_id: mockRiverId
        }
      })
    })

    it('should return true if an activity is found and an activityId is provided', async () => {
      Activity.count.mockResolvedValue(1)

      const result = await isActivityExists('3', '4', '2')

      expect(result).toBe(true)
    })

    it('should return false if activityId is included and no matching activity exists', async () => {
      Activity.count.mockResolvedValue(0)

      const result = await isActivityExists('3', '4', '2')

      expect(result).toBe(false)
    })

    it('should exclude the provided activityId in the where clause', async () => {
      const mockSubmissionId = '3'
      const mockRiverId = '4'
      const mockActivityId = 3
      Activity.count.mockResolvedValue(1)

      await isActivityExists(mockSubmissionId, mockRiverId, mockActivityId)

      expect(Activity.count).toHaveBeenCalledWith({
        where: {
          submission_id: mockSubmissionId,
          river_id: mockRiverId,
          id: { [Op.ne]: mockActivityId }
        }
      })
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
