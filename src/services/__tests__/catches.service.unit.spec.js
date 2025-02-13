import { Catch } from '../../entities/index.js'
import { getCatchById } from '../catches.service.js'

jest.mock('../../entities/index.js')

describe('catches.service.unit', () => {
  describe('getCatchById', () => {
    it('should return the catch if it exists', async () => {
      const mockCatch = {
        id: 1,
        dateCaught: '2024-08-02',
        species_id: '1',
        massKg: 23.5,
        released: true
      }
      Catch.findOne.mockResolvedValueOnce(mockCatch)

      const result = await getCatchById(1)

      expect(result).toBe(mockCatch)
    })

    it('should return null if the catch does not exist', async () => {
      Catch.findOne.mockResolvedValueOnce(null)

      const result = await getCatchById(999)

      expect(result).toBeNull()
    })

    it('should throw an error if findOne fails', async () => {
      const error = new Error('Database error')
      Catch.findOne.mockRejectedValueOnce(error)

      await expect(getCatchById(1)).rejects.toThrow('Database error')
    })
  })
})
