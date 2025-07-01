import {
  mapCRMPermissionToLicence,
  validatePermission
} from '../licences.mapper.js'

describe('licences.mapper.unit', () => {
  const getMockCRMPermission = () => [
    {
      entity: {
        referenceNumber: '23210126-2WC3FBP-ABNFA7'
      },
      expanded: {
        licensee: {
          entity: {
            id: 'a1a91429-deb7-ef11-b8e8-7c1e5237cbf4',
            firstName: 'Brenin',
            lastName: 'Pysgotwr'
          }
        }
      }
    }
  ]

  describe('mapCRMPermissionToLicence', () => {
    it('should map a CRM permission object to a licence object', () => {
      const result = mapCRMPermissionToLicence(getMockCRMPermission())
      expect(result).toStrictEqual({
        licenceNumber: '23210126-2WC3FBP-ABNFA7',
        contact: {
          id: 'a1a91429-deb7-ef11-b8e8-7c1e5237cbf4',
          fullName: 'Brenin Pysgotwr'
        }
      })
    })

    it('should handle missing first or last name by returning "Unknown" if both are absent', () => {
      const dataWithNoName = [
        {
          entity: { referenceNumber: '23210126-2WC3FBP-ABNFA7' },
          expanded: {
            licensee: { entity: { id: 'a1a91429-deb7-ef11-b8e8-7c1e5237cbf4' } }
          }
        }
      ]
      expect(mapCRMPermissionToLicence(dataWithNoName)).toStrictEqual({
        licenceNumber: '23210126-2WC3FBP-ABNFA7',
        contact: {
          id: 'a1a91429-deb7-ef11-b8e8-7c1e5237cbf4',
          fullName: 'Unknown'
        }
      })
    })

    it('should handle missing last name and return only the first name', () => {
      const dataWithOnlyFirstName = [
        {
          entity: { referenceNumber: '23210126-2WC3FBP-ABNFA7' },
          expanded: {
            licensee: {
              entity: {
                id: 'a1a91429-deb7-ef11-b8e8-7c1e5237cbf4',
                firstName: 'Brenin'
              }
            }
          }
        }
      ]
      expect(mapCRMPermissionToLicence(dataWithOnlyFirstName)).toStrictEqual({
        licenceNumber: '23210126-2WC3FBP-ABNFA7',
        contact: {
          id: 'a1a91429-deb7-ef11-b8e8-7c1e5237cbf4',
          fullName: 'Brenin'
        }
      })
    })

    it('should handle missing first name and return only the last name', () => {
      const dataWithOnlyLastName = [
        {
          entity: { referenceNumber: '23210126-2WC3FBP-ABNFA7' },
          expanded: {
            licensee: {
              entity: {
                id: 'a1a91429-deb7-ef11-b8e8-7c1e5237cbf4',
                lastName: 'Pysgotwr'
              }
            }
          }
        }
      ]
      expect(mapCRMPermissionToLicence(dataWithOnlyLastName)).toStrictEqual({
        licenceNumber: '23210126-2WC3FBP-ABNFA7',
        contact: {
          id: 'a1a91429-deb7-ef11-b8e8-7c1e5237cbf4',
          fullName: 'Pysgotwr'
        }
      })
    })
  })

  describe('validatePermission', () => {
    it.each([null, undefined, [], {}])(
      'should throw an error when input is %p',
      (invalidInput) => {
        expect(() => validatePermission(invalidInput, 'abc123')).toThrow(
          'Permission not found for abc123'
        )
      }
    )

    it('should throw an error if licence data is missing required fields', () => {
      const invalidData = [
        {
          entity: {},
          expanded: {
            licensee: { entity: { id: 'a1a91429-deb7-ef11-b8e8-7c1e5237cbf4' } }
          }
        }
      ]
      expect(() => validatePermission(invalidData, 'abc123')).toThrow(
        'Invalid permission data: Missing required fields.'
      )
    })

    it('should throw an error if contact ID is missing', () => {
      const invalidData = [
        {
          entity: { referenceNumber: '23210126-2WC3FBP-ABNFA7' },
          expanded: { licensee: { entity: {} } }
        }
      ]
      expect(() => validatePermission(invalidData, 'abc123')).toThrow(
        'Invalid permission data: Missing required fields.'
      )
    })

    it('should not throw any errors if the required fields are present', () => {
      expect(() =>
        validatePermission(getMockCRMPermission())
      ).not.toThrowError()
    })
  })
})
