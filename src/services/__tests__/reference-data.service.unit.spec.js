import { Role, retrieveMultipleAsMap } from '@defra-fish/dynamics-lib'
import {
  getReferenceData,
  getReferenceDataForEntity
} from '../reference-data.service.js'

describe('reference-data.service.unit', () => {
  describe('getReferenceData', () => {
    it('retrieves a map of reference data', async () => {
      const mockData = {
        roles: [
          { id: '1', name: 'Role 1' },
          { id: '2', name: 'Role 2' }
        ]
      }

      retrieveMultipleAsMap.mockReturnValue({
        cached: jest.fn().mockResolvedValue(mockData)
      })
      const result = await getReferenceData()
      expect(result).toBe(mockData)
    })
  })

  describe('getReferenceDataForEntity', () => {
    it('retrieves reference data for a specific entity', async () => {
      const mockData = {
        roles: [
          { id: '1', name: 'Role 1' },
          { id: '2', name: 'Role 2' }
        ]
      }

      retrieveMultipleAsMap.mockReturnValue({
        cached: jest.fn().mockResolvedValue(mockData)
      })

      const result = await getReferenceDataForEntity(Role)

      expect(result).toEqual(mockData.roles)
    })
  })
})
