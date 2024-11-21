import { Method } from '../../entities/index.js'
import { isMethodInternal } from '../methods.service.js'

jest.mock('../../entities/index.js')

describe('methods.service.unit', () => {
  describe('isMethodInternal', () => {
    const mockMethodId = '1'

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return true if the method is internal', async () => {
      Method.findOne.mockResolvedValue({ toJSON: () => ({ internal: true }) })

      const result = await isMethodInternal(mockMethodId)

      expect(result).toBe(true)
    })

    it('should return false if the method is not internal', async () => {
      Method.findOne.mockResolvedValue({ toJSON: () => ({ internal: false }) })

      const result = await isMethodInternal(mockMethodId)

      expect(result).toBe(false)
    })

    it('should return false if internal is undefined', async () => {
      Method.findOne.mockResolvedValue({
        toJSON: () => ({ internal: undefined })
      })

      const result = await isMethodInternal(mockMethodId)

      expect(result).toBe(false)
    })

    it('should throw an error if the method does not exist', async () => {
      Method.findOne.mockResolvedValue(null)

      await expect(isMethodInternal(mockMethodId)).rejects.toThrow(
        'Method does not exist'
      )
    })
  })
})
