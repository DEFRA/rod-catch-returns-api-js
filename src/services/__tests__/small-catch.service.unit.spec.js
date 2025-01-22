import { SmallCatch, SmallCatchCount } from '../../entities/index.js'
import {
  getSmallCatchById,
  getTotalSmallCatchCountsBySmallCatchId,
  isDuplicateSmallCatch
} from '../small-catch.service.js'
import { Op } from 'sequelize'

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
      expect(SmallCatch.count).toHaveBeenCalledWith({
        where: {
          activity_id: '1',
          month: 1
        }
      })
    })

    it('should handle errors thrown by SmallCatch.count', async () => {
      SmallCatch.count.mockRejectedValue(new Error('Database error'))

      await expect(isDuplicateSmallCatch('1', 1)).rejects.toThrow(
        'Database error'
      )
    })

    it('should return true if a duplicate small catch exists and ignoreMonth is defined', async () => {
      SmallCatch.count.mockResolvedValue(1)

      const result = await isDuplicateSmallCatch('1', 1, 2)

      expect(result).toBe(true)
    })

    it('should return false if no duplicate small catch exists with ignoreMonth defined', async () => {
      SmallCatch.count.mockResolvedValue(0)

      const result = await isDuplicateSmallCatch('1', 1, 2)

      expect(result).toBe(false)
    })

    it('should call SmallCatch.count with the correct where clause when ignoreMonth is undefined', async () => {
      SmallCatch.count.mockResolvedValue(0)

      await isDuplicateSmallCatch('1', 1)

      expect(SmallCatch.count).toHaveBeenCalledWith({
        where: {
          activity_id: '1',
          month: 1
        }
      })
    })

    it('should call SmallCatch.count with the correct where clause when ignoreMonth is defined', async () => {
      SmallCatch.count.mockResolvedValue(0)

      const result = await isDuplicateSmallCatch('1', 1, 2)

      expect(result).toBe(false)
      expect(SmallCatch.count).toHaveBeenCalledWith({
        where: {
          activity_id: '1',
          month: {
            [Op.and]: [{ [Op.eq]: 1 }, { [Op.ne]: 2 }]
          }
        }
      })
    })
  })

  describe('getSmallCatchById', () => {
    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return the small catch if found', async () => {
      const mockSmallCatch = {
        id: '123',
        activity_id: '1',
        month: 1,
        released: true
      }
      SmallCatch.findOne.mockResolvedValue(mockSmallCatch)

      const result = await getSmallCatchById('123')

      expect(result).toEqual(mockSmallCatch)
    })

    it('should return null if no small catch is found', async () => {
      SmallCatch.findOne.mockResolvedValue(null)

      const result = await getSmallCatchById('123')

      expect(result).toBeNull()
    })

    it('should throw an error if SmallCatch.findOne fails', async () => {
      const error = new Error('Database error')
      SmallCatch.findOne.mockRejectedValue(error)

      await expect(getSmallCatchById('123')).rejects.toThrow('Database error')
    })
  })

  describe('getTotalSmallCatchCountsBySmallCatchId', () => {
    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return the total count when small catch counts exist', async () => {
      const smallCatchId = 1
      const mockCounts = [{ count: 5 }, { count: 10 }, { count: 15 }]
      SmallCatchCount.findAll.mockResolvedValue(mockCounts)

      const result = await getTotalSmallCatchCountsBySmallCatchId(smallCatchId)

      expect(result).toBe(30)
    })

    it('should return 0 when no small catch counts exist', async () => {
      const smallCatchId = 1
      SmallCatchCount.findAll.mockResolvedValue([])

      const result = await getTotalSmallCatchCountsBySmallCatchId(smallCatchId)

      expect(result).toBe(0)
    })

    it('should throw an error if SmallCatchCount.findAll fails', async () => {
      const smallCatchId = 1
      const error = new Error('Database error')

      SmallCatchCount.findAll.mockRejectedValue(error)

      await expect(
        getTotalSmallCatchCountsBySmallCatchId(smallCatchId)
      ).rejects.toThrow('Database error')
    })
  })
})
