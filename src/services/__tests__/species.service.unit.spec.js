import { Species } from '../../entities/index.js'
import { isSpeciesExists } from '../species.service.js'

jest.mock('../../entities/index.js')

describe('species.service.unit', () => {
  describe('isSpeciesExists', () => {
    const mockSpeciesId = 'abc123'

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return true if species exists', async () => {
      Species.count.mockResolvedValue(1)

      const result = await isSpeciesExists(mockSpeciesId)

      expect(result).toBe(true)
    })

    it('should return false if species does not exist', async () => {
      Species.count.mockResolvedValue(0)

      const result = await isSpeciesExists(mockSpeciesId)

      expect(result).toBe(false)
    })

    it('should handle errors thrown by Species.count', async () => {
      Species.count.mockRejectedValue(new Error('Database error'))

      await expect(isSpeciesExists(mockSpeciesId)).rejects.toThrow(
        'Database error'
      )
    })
  })
})
