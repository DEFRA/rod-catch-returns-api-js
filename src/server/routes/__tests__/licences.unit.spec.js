import { contactForLicensee } from '@defra-fish/dynamics-lib'
import logger from '../../../utils/logger-utils.js'
import routes from '../licences.js'

jest.mock('@defra-fish/dynamics-lib')
jest.mock('../../../utils/logger-utils.js')

describe('licences.unit', () => {
  describe('GET /licence/{licence}', () => {
    const getLicenceHandler = routes[0].options.handler

    const request = {
      params: { licence: 'B7A111' },
      query: { verification: 'WA4 1HT' }
    }

    const h = {
      response: jest.fn().mockReturnThis(),
      code: jest.fn()
    }

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return licence and contact details when login is successful', async () => {
      const dynamicsResponse = {
        ReturnStatus: 'success',
        ContactId: 'contact-identifier-111',
        Postcode: 'WA4 1HT',
        ReturnPermissionNumber: '11100420-2WT1SFT-B7A111'
      }
      contactForLicensee.mockResolvedValueOnce(dynamicsResponse)

      await getLicenceHandler(request, h)

      expect(contactForLicensee).toHaveBeenCalledWith('B7A111', 'WA4 1HT')
      expect(h.response).toHaveBeenCalledWith(
        expect.objectContaining({
          licenceNumber: '11100420-2WT1SFT-B7A111',
          contact: expect.objectContaining({
            id: 'contact-identifier-111',
            postcode: 'WA4 1HT'
          })
        })
      )
      expect(h.code).toHaveBeenCalledWith(200)
    })

    it('should return 403 when login is unsuccessful', async () => {
      const dynamicsResponse = {
        ReturnStatus: 'failed',
        ContactId: null,
        Postcode: null
      }
      contactForLicensee.mockResolvedValueOnce(dynamicsResponse)

      await getLicenceHandler(request, h)

      expect(contactForLicensee).toHaveBeenCalledWith('B7A111', 'WA4 1HT')
      expect(logger.info).toHaveBeenCalledWith(
        'Login unsuccessful with request %s and %s. Response: %s',
        'B7A111',
        'WA4 1HT',
        JSON.stringify(dynamicsResponse)
      )
      expect(h.response).toHaveBeenCalled()
      expect(h.code).toHaveBeenCalledWith(403)
    })

    it('should log and throw error when an exception occurs', async () => {
      const error = new Error('Unexpected error')
      contactForLicensee.mockRejectedValueOnce(error)

      await expect(getLicenceHandler(request, h)).rejects.toThrow(error)
      expect(logger.error).toHaveBeenCalledWith(error)
    })
  })
})
