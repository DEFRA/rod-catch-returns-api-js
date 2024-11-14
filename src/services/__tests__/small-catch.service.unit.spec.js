import { SmallCatch } from '../../entities/index.js'
import { isDuplicateSmallCatch } from '../small-catch.service.js'

jest.mock('../../entities/index.js')

describe('small-catch.service.unit', () => {
  describe('isDuplicateSmallCatch', () => {
    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return true if the small catch with activity id and month exists', async () => {
      SmallCatch.count.mockResolvedValue(1)

      const result = await isDuplicateSmallCatch('1', 1)

      expect(result).toBe(true)
    })

    it('should return false if the small catch with activity id and month does not exist', async () => {
      SmallCatch.count.mockResolvedValue(0)

      const result = await isDuplicateSmallCatch('1', 1)

      expect(result).toBe(false)
    })

    it('should handle errors thrown by SmallCatch.count', async () => {
      SmallCatch.count.mockRejectedValue(new Error('Database error'))

      await expect(isDuplicateSmallCatch('1', 1)).rejects.toThrow(
        'Database error'
      )
    })
  })
})
