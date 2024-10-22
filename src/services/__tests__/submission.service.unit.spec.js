import { Submission } from '../../entities/submission.entity.js'
import { isSubmissionExists } from '../submissions.service.js'

jest.mock('../../entities/submission.entity.js')

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
})
