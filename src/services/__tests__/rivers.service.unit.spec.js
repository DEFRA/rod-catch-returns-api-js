import { River } from '../../entities/index.js'
import { isRiverInternal } from '../rivers.service.js'

jest.mock('../../entities/index.js')

describe('rivers.service.unit', () => {
  describe('isRiverInternal', () => {
    const mockRiverId = 'river-123'

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return true if the river is internal', async () => {
      River.findByPk.mockResolvedValue({ internal: true })

      const result = await isRiverInternal(mockRiverId)

      expect(result).toBe(true)
    })

    it('should return false if the river is not internal', async () => {
      River.findByPk.mockResolvedValue({ internal: false })

      const result = await isRiverInternal(mockRiverId)

      expect(result).toBe(false)
    })

    it('should return false if internal is undefined', async () => {
      River.findByPk.mockResolvedValue({ internal: undefined })

      const result = await isRiverInternal(mockRiverId)

      expect(result).toBe(false)
    })

    it('should throw an error if the river does not exist', async () => {
      River.findByPk.mockResolvedValue(null)

      await expect(isRiverInternal(mockRiverId)).rejects.toThrow(
        'RIVER_NOT_FOUND'
      )
    })
  })
})
