import { isMethodInternal, isMethodsInternal } from '../methods.service.js'
import { Method } from '../../entities/index.js'

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

  describe('isMethodsInternal', () => {
    const mockMethodIds = ['1', '2', '3']

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return true if at least one method is internal', async () => {
      Method.findAll.mockResolvedValue([
        { id: '1', toJSON: () => ({ internal: false }) },
        { id: '2', toJSON: () => ({ internal: true }) },
        { id: '3', toJSON: () => ({ internal: false }) }
      ])

      const result = await isMethodsInternal(mockMethodIds)

      expect(result).toBe(true)
    })

    it('should return false if none of the methods are internal', async () => {
      Method.findAll.mockResolvedValue([
        { id: '1', toJSON: () => ({ internal: false }) },
        { id: '2', toJSON: () => ({ internal: false }) },
        { id: '3', toJSON: () => ({ internal: false }) }
      ])

      const result = await isMethodsInternal(mockMethodIds)

      expect(result).toBe(false)
    })

    it('should return false if internal is undefined for all methods', async () => {
      Method.findAll.mockResolvedValue([
        { id: '1', toJSON: () => ({ internal: undefined }) },
        { id: '2', toJSON: () => ({ internal: undefined }) },
        { id: '3', toJSON: () => ({ internal: undefined }) }
      ])

      const result = await isMethodsInternal(mockMethodIds)

      expect(result).toBe(false)
    })

    it('should throw an error if any method does not exist', async () => {
      Method.findAll.mockResolvedValue([
        { id: '1', toJSON: () => ({ internal: false }) }
      ]) // Only one method returned, others are missing

      await expect(isMethodsInternal(mockMethodIds)).rejects.toThrow(
        'Methods do not exist: 2, 3'
      )
    })
  })
})
