import {
  getMockResponseToolkit,
  getServerDetails
} from '../../../test-utils/server-test-utils.js'
import { contactForLicensee } from '@defra-fish/dynamics-lib'
import { handleServerError } from '../../../utils/server-utils.js'
import logger from '../../../utils/logger-utils.js'
import routes from '../licences.js'

jest.mock('../../../utils/logger-utils.js')
jest.mock('../../../utils/server-utils.js')

const [
  {
    options: { handler: getLicenceHandler }
  }
] = routes

const SERVER_ERROR_SYMBOL = Symbol('SERVER_ERROR')

handleServerError.mockReturnValue(SERVER_ERROR_SYMBOL)

describe('licences.unit', () => {
  describe('GET /licence/{licence}', () => {
    const getUnsuccessfulDynamicsResponse = () => ({
      ReturnStatus: 'failed',
      ContactId: null,
      Postcode: null
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    const getLicenceRequest = ({
      licence = 'B7A111',
      verification = 'WA4 1HT'
    } = {}) => ({
      ...getServerDetails(),
      params: { licence },
      query: { verification }
    })

    it('should return licence and contact details when login is successful', async () => {
      const dynamicsResponse = {
        ReturnStatus: 'success',
        ContactId: 'contact-identifier-111',
        Postcode: 'WA4 1HT',
        ReturnPermissionNumber: '11100420-2WT1SFT-B7A111'
      }
      contactForLicensee.mockResolvedValueOnce(dynamicsResponse)

      const result = await getLicenceHandler(
        getLicenceRequest(),
        getMockResponseToolkit()
      )

      expect(result.payload).toEqual({
        licenceNumber: '11100420-2WT1SFT-B7A111',
        contact: {
          id: 'contact-identifier-111',
          postcode: 'WA4 1HT'
        }
      })
      expect(result.statusCode).toBe(200)
    })

    it('should return 403 when login is unsuccessful', async () => {
      const dynamicsResponse = getUnsuccessfulDynamicsResponse()
      contactForLicensee.mockResolvedValueOnce(dynamicsResponse)

      const result = await getLicenceHandler(
        getLicenceRequest(),
        getMockResponseToolkit()
      )

      expect(result.payload).toBe()
      expect(result.statusCode).toBe(403)
    })

    it('should return log an error when login is unsuccessful', async () => {
      const dynamicsResponse = getUnsuccessfulDynamicsResponse()
      contactForLicensee.mockResolvedValueOnce(dynamicsResponse)

      await getLicenceHandler(getLicenceRequest(), getMockResponseToolkit())

      expect(logger.info).toHaveBeenCalledWith(
        'Login unsuccessful with request %s and %s. Response: %s',
        'B7A111',
        'WA4 1HT',
        JSON.stringify(dynamicsResponse)
      )
    })

    it('should call handleServerError if an error occurs', async () => {
      const error = new Error('Unexpected error')
      contactForLicensee.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      await getLicenceHandler(getLicenceRequest(), h)

      expect(handleServerError).toHaveBeenCalledWith(
        'Error with user login',
        error,
        h
      )
    })

    it('should return an error response if an error occurs while creating the catch', async () => {
      const error = new Error('Unexpected error')
      contactForLicensee.mockRejectedValueOnce(error)

      const result = await getLicenceHandler(
        getLicenceRequest(),
        getMockResponseToolkit()
      )

      expect(result).toBe(SERVER_ERROR_SYMBOL)
    })
  })
})
