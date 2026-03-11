import {
  getActivityAndSubmissionByActivityId,
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

  describe('getActivityAndSubmissionByActivityId', () => {
    afterEach(() => {
      jest.clearAllMocks()
    })

    const getMockActivity = () => ({
      id: '275750',
      daysFishedWithMandatoryRelease: 1,
      daysFishedOther: 1,
      createdAt: '2025-12-29T10:53:23.802Z',
      updatedAt: '2025-12-29T15:01:35.363Z',
      version: '2025-12-29T15:01:35.363Z',
      submission_id: '328750',
      river_id: '1',
      SubmissionId: '328750',
      Submission: {
        id: '328750',
        contactId: 'da6a6ac1-88d9-eb11-bacb-000d3ade9fad',
        season: 2020,
        status: 'INCOMPLETE',
        source: 'WEB',
        reportingExclude: false,
        createdAt: '2025-12-29T10:53:09.237Z',
        updatedAt: '2025-12-29T10:53:09.237Z',
        version: '2025-12-29T10:53:09.197Z'
      }
    })

    it('should return the activity with the linked submission if it exists', async () => {
      const mockActivity = getMockActivity()
      Activity.findOne.mockResolvedValue(mockActivity)

      const result = await getActivityAndSubmissionByActivityId('275750')

      expect(result).toBe(mockActivity)
    })

    it('should call Activity.findOne with the correct parameters', async () => {
      Activity.findOne.mockResolvedValue(getMockActivity())

      await getActivityAndSubmissionByActivityId('275750')

      expect(Activity.findOne).toHaveBeenCalledWith({
        where: { id: '275750' },
        include: [
          {
            model: expect.anything(),
            required: true
          }
        ]
      })
    })

    it('should return null if no activity is found', async () => {
      Activity.findOne.mockResolvedValue(null)

      const result = await getActivityAndSubmissionByActivityId('275750')

      expect(result).toBeNull()
    })

    it('should throw an error if Activity.findOne throws', async () => {
      Activity.findOne.mockRejectedValue(new Error('Database error'))

      await expect(
        getActivityAndSubmissionByActivityId('275750')
      ).rejects.toThrow(
        `Failed to fetch activity or linked submission for activity ID 275750: Error: Database error`
      )
    })
  })
})
