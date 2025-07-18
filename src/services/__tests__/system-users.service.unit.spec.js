import {
  SystemUser,
  SystemUserRole,
  findByExample
} from '@defra-fish/dynamics-lib'
import { getReferenceDataForEntity } from '../reference-data.service.js'
import { getSystemUserByOid } from '../system-users.service.js'

jest.mock('../reference-data.service.js')

describe('system-users.service.unit', () => {
  const getMockCache = () => ({
    get: jest.fn(),
    set: jest.fn()
  })

  const getMockUser = (overrides) =>
    Object.assign(new SystemUser(), {
      id: '26449770-5e67-e911-a988-000d3ab9df39',
      oid: 'e4661642-0a25-4d49-b7bd-8178699e0161',
      lastName: 'Gardner-Dell',
      firstName: 'Sam',
      isDisabled: false,
      ...overrides
    })

  const getMockReferenceDataForEntity = () => [
    {
      id: 'b05d5203-b4c7-e811-a976-000d3ab9a49f',
      name: 'Test role 1'
    },
    {
      id: 'e739f82a-9519-e911-817c-000d3a0718d1',
      name: 'Test role 2'
    }
  ]

  describe('getSystemUserByOid', () => {
    it('should return the system user if the OID is valid', async () => {
      findByExample.mockResolvedValueOnce([
        {
          toJSON: jest.fn().mockReturnValueOnce(getMockUser())
        }
      ])
      findByExample.mockResolvedValueOnce([
        Object.assign(new SystemUserRole(), {
          roleId: 'b05d5203-b4c7-e811-a976-000d3ab9a49f',
          systemUserId: '26449770-5e67-e911-a988-000d3ab9df39'
        }),
        Object.assign(new SystemUserRole(), {
          roleId: 'e739f82a-9519-e911-817c-000d3a0718d1',
          systemUserId: '26449770-5e67-e911-a988-000d3ab9df39'
        })
      ])

      getReferenceDataForEntity.mockResolvedValueOnce(
        getMockReferenceDataForEntity()
      )

      const systemUser = await getSystemUserByOid(
        '26449770-5e67-e911-a988-000d3ab9df39',
        getMockCache()
      )

      expect(systemUser).toStrictEqual({
        id: '26449770-5e67-e911-a988-000d3ab9df39',
        oid: 'e4661642-0a25-4d49-b7bd-8178699e0161',
        lastName: 'Gardner-Dell',
        firstName: 'Sam',
        isDisabled: false,
        roles: [
          { id: 'b05d5203-b4c7-e811-a976-000d3ab9a49f', name: 'Test role 1' },
          { id: 'e739f82a-9519-e911-817c-000d3a0718d1', name: 'Test role 2' }
        ]
      })
    })

    it('should handle users with no roles', async () => {
      findByExample.mockResolvedValueOnce([
        {
          toJSON: jest.fn().mockReturnValue(getMockUser())
        }
      ])

      findByExample.mockResolvedValueOnce([])

      getReferenceDataForEntity.mockResolvedValueOnce(
        getMockReferenceDataForEntity()
      )

      const systemUser = await getSystemUserByOid(
        'e4661642-0a25-4d49-b7bd-8178699e0161',
        getMockCache()
      )

      expect(systemUser).toStrictEqual({
        id: '26449770-5e67-e911-a988-000d3ab9df39',
        oid: 'e4661642-0a25-4d49-b7bd-8178699e0161',
        lastName: 'Gardner-Dell',
        firstName: 'Sam',
        isDisabled: false,
        roles: []
      })
    })

    it('should cache the user if it is not already there', async () => {
      const cache = getMockCache()
      cache.get.mockResolvedValueOnce(null)

      findByExample.mockResolvedValueOnce([
        {
          toJSON: jest.fn().mockReturnValue(getMockUser())
        }
      ])

      findByExample.mockResolvedValueOnce([])

      await getSystemUserByOid('e4661642-0a25-4d49-b7bd-8178699e0161', cache)

      expect(cache.set).toHaveBeenCalledWith(
        'e4661642-0a25-4d49-b7bd-8178699e0161',
        {
          firstName: 'Sam',
          id: '26449770-5e67-e911-a988-000d3ab9df39',
          isDisabled: false,
          lastName: 'Gardner-Dell',
          oid: 'e4661642-0a25-4d49-b7bd-8178699e0161',
          roles: []
        },
        300000
      )
    })

    it('should return the user from the cache if it is there', async () => {
      const cache = getMockCache()
      cache.get.mockResolvedValueOnce(getMockUser())

      await getSystemUserByOid('e4661642-0a25-4d49-b7bd-8178699e0161', cache)

      expect(cache.set).not.toHaveBeenCalled()
    })

    it('should return an error if it could not find a user', async () => {
      findByExample.mockResolvedValueOnce([])

      await expect(
        getSystemUserByOid(
          '26449770-5e67-e911-a988-000d3ab9df39',
          getMockCache()
        )
      ).rejects.toThrow(
        'Unable to fetch system user 26449770-5e67-e911-a988-000d3ab9df39'
      )
    })
  })
})
