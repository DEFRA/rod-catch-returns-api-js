import { mapCRMPermissionToLicence } from '../licences.mapper.js'

describe('licences.mapper.unit', () => {
  const getMockCRMPermission = () => [
    {
      entity: {
        id: '51ebe149-bed8-ef11-8ee9-000d3adc17d1',
        referenceNumber: '23210126-2WC3FBP-ABNFA7',
        issueDate: '2025-01-22T12:41:47.000Z',
        startDate: '2025-01-22T13:11:47.000Z',
        endDate: '2026-01-21T23:59:59.000Z',
        stagingId: 'b564de0f-6eb9-4d4e-b771-24d9c7bea157',
        dataSource: {
          id: 910400003,
          label: 'Web Sales',
          description: 'Web Sales'
        },
        isRenewal: false,
        isLicenceForYou: {
          id: 1,
          label: 'Yes',
          description: 'Yes'
        }
      },
      expanded: {
        licensee: {
          entity: {
            id: 'a1a91429-deb7-ef11-b8e8-7c1e5237cbf4',
            firstName: 'Brenin',
            lastName: 'Pysgotwr',
            birthDate: '1987-10-12',
            email: null,
            mobilePhone: null,
            organisation: null,
            premises: '30',
            street: 'The Village',
            locality: null,
            town: 'York',
            postcode: 'YO32 5XS',
            country: {
              id: 910400195,
              label: 'England',
              description: 'GB-ENG'
            },
            preferredMethodOfConfirmation: {
              id: 910400003,
              label: 'Prefer not to be contacted',
              description: 'Prefer not to be contacted'
            },
            preferredMethodOfNewsletter: {
              id: 910400003,
              label: 'Prefer not to be contacted',
              description: 'Prefer not to be contacted'
            },
            preferredMethodOfReminder: {
              id: 910400001,
              label: 'Letter',
              description: 'Letter'
            },
            postalFulfilment: true,
            obfuscatedDob: '93198710124205',
            shortTermPreferredMethodOfConfirmation: {
              id: 910400003,
              label: 'Prefer not to be contacted',
              description: 'Prefer not to be contacted'
            }
          }
        },
        permit: {
          entity: {
            id: '540576cb-9160-eb11-89f5-000d3a649465',
            description: 'Coarse 12 month 2 Rod Licence (Full)',
            permitType: {
              id: 910400000,
              label: 'Rod Fishing Licence',
              description: 'Rod Fishing Licence'
            },
            permitSubtype: {
              id: 910400001,
              label: 'Trout and coarse',
              description: 'C'
            },
            durationMagnitude: 12,
            durationDesignator: {
              id: 910400001,
              label: 'Month(s)',
              description: 'M'
            },
            numberOfRods: 2,
            availableFrom: '2017-03-31T23:00:00.000Z',
            availableTo: '2037-03-31T23:59:00.000Z',
            isForFulfilment: true,
            isCounterSales: true,
            isRecurringPaymentSupported: true,
            cost: 35.8,
            newCost: 36.8,
            newCostStartDate: '2025-03-31T23:00:00.000Z',
            itemId: '42309'
          }
        },
        concessionProofs: []
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

    it('should return null when input is an empty array', () => {
      expect(mapCRMPermissionToLicence([])).toBeNull()
    })

    it.each([null, undefined, {}])(
      'should return null when input is %p',
      (invalidInput) => {
        expect(mapCRMPermissionToLicence(invalidInput)).toBeNull()
      }
    )

    it('should return null if licence data is missing required fields', () => {
      const invalidData = [
        {
          entity: {},
          expanded: {
            licensee: { entity: { id: 'a1a91429-deb7-ef11-b8e8-7c1e5237cbf4' } }
          }
        }
      ]
      expect(mapCRMPermissionToLicence(invalidData)).toBeNull()
    })

    it('should return null if contact ID is missing', () => {
      const invalidData = [
        {
          entity: { referenceNumber: '23210126-2WC3FBP-ABNFA7' },
          expanded: { licensee: { entity: {} } }
        }
      ]
      expect(mapCRMPermissionToLicence(invalidData)).toBeNull()
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
})
