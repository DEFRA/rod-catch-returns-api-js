import { contactForLicensee } from '@defra-fish/dynamics-lib'
import initialiseServer from '../../server.js'

const mockResponse = {
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
}

const noContactResponse = {
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
}

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
    it('should return the licence and contact details and a 200 status code, if licence number and postcode are valid', async () => {
      contactForLicensee.mockResolvedValue(mockResponse)

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
      contactForLicensee.mockResolvedValue(noContactResponse)

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
})
