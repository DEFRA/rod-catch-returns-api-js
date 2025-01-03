import { Catch, Submission } from '../../entities/index.js'
import {
  getSubmission,
  getSubmissionByCatchId,
  isSubmissionExists
} from '../submissions.service.js'

jest.mock('../../entities/index.js')

describe('submission.service.unit', () => {
  describe('isSubmissionExists', () => {
    const mockSubmissionId = 'abc123'

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return true if submission exists', async () => {
      Submission.count.mockResolvedValue(1)

      const result = await isSubmissionExists(mockSubmissionId)

      expect(result).toBe(true)
    })

    it('should return false if submission does not exist', async () => {
      Submission.count.mockResolvedValue(0)

      const result = await isSubmissionExists(mockSubmissionId)

      expect(result).toBe(false)
    })

    it('should handle errors thrown by Submission.count', async () => {
      Submission.count.mockRejectedValue(new Error('Database error'))

      await expect(isSubmissionExists(mockSubmissionId)).rejects.toThrow(
        'Database error'
      )
    })
  })

  describe('getSubmission', () => {
    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return submission if found', async () => {
      const mockSubmission = {
        id: '1',
        contactId: 'contact-identifier-111',
        season: '2024',
        status: 'INCOMPLETE',
        source: 'WEB',
        version: '2024-10-10T13:13:11.000Z',
        reportingExclude: false,
        createdAt: '2024-10-10T13:13:11.000Z',
        updatedAt: '2024-10-10T13:13:11.000Z'
      }
      Submission.findOne.mockResolvedValue(mockSubmission)

      const result = await getSubmission('123')

      expect(result).toEqual({
        id: '1',
        contactId: 'contact-identifier-111',
        season: '2024',
        status: 'INCOMPLETE',
        source: 'WEB',
        version: '2024-10-10T13:13:11.000Z',
        reportingExclude: false,
        createdAt: '2024-10-10T13:13:11.000Z',
        updatedAt: '2024-10-10T13:13:11.000Z'
      })
    })

    it('should return null if submission is not found', async () => {
      Submission.findOne.mockResolvedValue(null)

      const result = await getSubmission('123')

      expect(result).toBeNull()
    })

    it('should handle errors thrown by Submission.findOne', async () => {
      Submission.findOne.mockRejectedValue(new Error('Database error'))

      await expect(getSubmission('123')).rejects.toThrow('Database error')
    })
  })

  describe('getSubmissionByCatchId', () => {
    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return the submission if the catch with submission exists', async () => {
      Catch.findOne.mockResolvedValue({
        Activity: {
          daysFishedWithMandatoryRelease: 5,
          daysFishedOther: 3,
          river: 'rivers/456',
          Submission: {
            id: '1',
            contactId: 'contact-identifier-111',
            season: '2024',
            status: 'INCOMPLETE',
            source: 'WEB',
            version: '2024-10-10T13:13:11.000Z',
            reportingExclude: false,
            createdAt: '2024-10-10T13:13:11.000Z',
            updatedAt: '2024-10-10T13:13:11.000Z'
          }
        }
      })

      const result = await getSubmissionByCatchId('1')

      expect(result).toStrictEqual({
        id: '1',
        contactId: 'contact-identifier-111',
        season: '2024',
        status: 'INCOMPLETE',
        source: 'WEB',
        version: '2024-10-10T13:13:11.000Z',
        reportingExclude: false,
        createdAt: '2024-10-10T13:13:11.000Z',
        updatedAt: '2024-10-10T13:13:11.000Z'
      })
    })

    it('should throw an error if no catch is found for the catch ID', async () => {
      Catch.findOne.mockResolvedValue(null)

      await expect(getSubmissionByCatchId('2')).rejects.toThrow(
        'Failed to fetch submission for catch ID 2: Error: No Catch found for catch ID 2'
      )
    })

    it('should throw an error if no activity is found for the catch ID', async () => {
      Catch.findOne.mockResolvedValue({})

      await expect(getSubmissionByCatchId('2')).rejects.toThrow(
        'Failed to fetch submission for catch ID 2: Error: No Activity found for catch ID 2'
      )
    })

    it('should throw an error if Catch.findOne fails', async () => {
      Catch.findOne.mockRejectedValue(new Error('Database error'))

      await expect(getSubmissionByCatchId('2')).rejects.toThrow(
        'Failed to fetch submission for catch ID 2: Error: Database error'
      )
    })
  })
})
