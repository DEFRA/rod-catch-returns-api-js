import { contactForLicensee, executeQuery } from '@defra-fish/dynamics-lib'
import initialiseServer from '../../server.js'

describe('licences.integration', () => {
  /** @type {import('@hapi/hapi').Server} */
  let server = null

  beforeAll(async () => {
    server = await initialiseServer({ port: null })
  })

  afterAll(async () => {
    await server.stop()
  })

  describe('GET /api/licence', () => {
    const getMockContactResponse = () => ({
      ContactId: 'contact-identifier-111',
      FirstName: 'Fester',
      LastName: 'Tester',
      DateOfBirth: '9/13/1946 12:00:00 AM',
      Premises: '47',
      Street: null,
      Town: 'Testerton',
      Locality: null,
      Postcode: 'WA4 1HT',
      ReturnStatus: 'success',
      SuccessMessage: 'contact found successfully',
      ErrorMessage: null,
      ReturnPermissionNumber: '11100420-2WT1SFT-B7A111',
      oDataContext:
        'https://api.com/api/data/v9.1/$metadata#Microsoft.Dynamics.CRM.defra_GetContactByLicenceAndPostcodeResponse'
    })

    const getMockNoContactResponse = () => ({
      ContactId: null,
      FirstName: null,
      LastName: null,
      DateOfBirth: null,
      Premises: null,
      Street: null,
      Town: null,
      Locality: null,
      Postcode: null,
      ReturnStatus: 'error',
      SuccessMessage: '',
      ErrorMessage: 'contact does not exists',
      ReturnPermissionNumber: null,
      oDataContext:
        'https://api.crm4.dynamics.com/api/data/v9.1/$metadata#Microsoft.Dynamics.CRM.defra_GetContactByLicenceAndPostcodeResponse'
    })

    it('should return the licence and contact details and a 200 status code, if licence number and postcode are valid', async () => {
      contactForLicensee.mockResolvedValue(getMockContactResponse())

      const result = await server.inject({
        method: 'GET',
        url: '/api/licence/B7A111?verification=WA4 1HT'
      })

      expect(result.statusCode).toBe(200)
      expect(JSON.parse(result.payload)).toMatchObject({
        licenceNumber: '11100420-2WT1SFT-B7A111',
        contact: {
          id: 'contact-identifier-111',
          postcode: 'WA4 1HT'
        }
      })
    })

    it('should return 403 if licence number or postcode is invalid', async () => {
      contactForLicensee.mockResolvedValue(getMockNoContactResponse())

      const result = await server.inject({
        method: 'GET',
        url: '/api/licence/B7A118?verification=WA4 1HT'
      })

      expect(result.statusCode).toBe(403)
    })

    it('should return 500 if there is any other error', async () => {
      contactForLicensee.mockRejectedValue(new Error('error'))

      const result = await server.inject({
        method: 'GET',
        url: '/api/licence/B7A111?verification=WA4 1HT'
      })

      expect(result.statusCode).toBe(500)
    })
  })

  describe('GET /api/licence/full/{licence}', () => {
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

    it('should return the licence number and contact details, if the licence number is valid', async () => {
      executeQuery.mockResolvedValueOnce(getMockCRMPermission())
      const result = await server.inject({
        method: 'GET',
        url: '/api/licence/full/23210126-2WC3FBP-ABNFA7'
      })

      expect(JSON.parse(result.payload)).toStrictEqual({
        licenceNumber: '23210126-2WC3FBP-ABNFA7',
        contact: {
          id: 'a1a91429-deb7-ef11-b8e8-7c1e5237cbf4',
          fullName: 'Brenin Pysgotwr'
        }
      })
      expect(result.statusCode).toBe(200)
    })

    it('should return 403 if licence number is no found', async () => {
      executeQuery.mockResolvedValueOnce({})
      const result = await server.inject({
        method: 'GET',
        url: '/api/licence/full/23210126-2WC3FBP-ABNFA7'
      })

      expect(JSON.parse(result.payload)).toStrictEqual({
        message: 'Invalid permission data: Expected a non-empty array.'
      })
      expect(result.statusCode).toBe(403)
    })

    it('should return 400 if licence number is in the incorrect format', async () => {
      const result = await server.inject({
        method: 'GET',
        url: '/api/licence/full/@321012!-2WC3FBP-ABNFA7'
      })

      expect(JSON.parse(result.payload)).toStrictEqual({
        errors: [
          {
            entity: 'Licence',
            message:
              '"licence" with value "@321012!-2WC3FBP-ABNFA7" fails to match the required pattern: /^[A-Za-z0-9-]*$/',
            property: 'licence',
            value: '@321012!-2WC3FBP-ABNFA7'
          }
        ]
      })
      expect(result.statusCode).toBe(400)
    })

    it('should return 500 if there is any other error', async () => {
      executeQuery.mockRejectedValue(new Error('error'))

      const result = await server.inject({
        method: 'GET',
        url: '/api/licence/full/23210126-2WC3FBP-ABNFA7'
      })

      expect(result.statusCode).toBe(500)
    })
  })
})
