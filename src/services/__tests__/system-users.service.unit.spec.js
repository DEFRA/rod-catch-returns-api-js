import {
  SystemUser,
  SystemUserRole,
  findByExample
} from '@defra-fish/dynamics-lib'
import { getReferenceDataForEntity } from '../reference-data.service.js'
import { getSystemUserByOid } from '../system-users.service.js'

jest.mock('../reference-data.service.js')

describe('system-users.service.unit', () => {
  describe('getSystemUserByOid', () => {
    it('should return the system user if the OID is valid', async () => {
      findByExample.mockResolvedValueOnce([
        {
          toJSON: jest.fn().mockReturnValueOnce(
            Object.assign(new SystemUser(), {
              id: '26449770-5e67-e911-a988-000d3ab9df39',
              oid: 'e4661642-0a25-4d49-b7bd-8178699e0161',
              lastName: 'Gardner-Dell',
              firstName: 'Sam',
              isDisabled: false
            })
          )
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

      getReferenceDataForEntity.mockResolvedValueOnce([
        {
          id: 'b05d5203-b4c7-e811-a976-000d3ab9a49f',
          name: 'Test role 1'
        },
        {
          id: 'e739f82a-9519-e911-817c-000d3a0718d1',
          name: 'Test role 2'
        }
      ])

      const systemUser = await getSystemUserByOid(
        '26449770-5e67-e911-a988-000d3ab9df39'
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
  })
})
