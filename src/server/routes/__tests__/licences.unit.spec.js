import { contactForLicensee, executeQuery } from '@defra-fish/dynamics-lib'
import {
  getMockResponseToolkit,
  getServerDetails
} from '../../../test-utils/server-test-utils.js'
import { handleServerError } from '../../../utils/server-utils.js'
import logger from '../../../utils/logger-utils.js'
import routes from '../licences.js'

jest.mock('../../../utils/logger-utils.js')
jest.mock('../../../utils/server-utils.js')

const [
  {
    options: { handler: getLicenceHandler }
  },
  {
    options: { handler: getFullLicenceHandler }
  }
] = routes

const SERVER_ERROR_SYMBOL = Symbol('SERVER_ERROR')

handleServerError.mockReturnValue(SERVER_ERROR_SYMBOL)

describe('licences.unit', () => {
  describe('GET /licence/{licence}', () => {
    const getUnsuccessfulCRMResponse = () => ({
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
      const dynamicsResponse = getUnsuccessfulCRMResponse()
      contactForLicensee.mockResolvedValueOnce(dynamicsResponse)

      const result = await getLicenceHandler(
        getLicenceRequest(),
        getMockResponseToolkit()
      )

      expect(result.payload).toBe()
      expect(result.statusCode).toBe(403)
    })

    it('should return log an error when login is unsuccessful', async () => {
      const dynamicsResponse = getUnsuccessfulCRMResponse()
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

  describe('GET /licence/full/{licence}', () => {
    afterEach(() => {
      jest.clearAllMocks()
    })

    const getLicenceRequest = ({
      licence = '11100420-2WT1SFT-B7A111'
    } = {}) => ({
      ...getServerDetails(),
      params: { licence }
    })

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

    it('should return mapped licence details when the licence is found', async () => {
      executeQuery.mockResolvedValueOnce(getMockCRMPermission())

      const result = await getFullLicenceHandler(
        getLicenceRequest(),
        getMockResponseToolkit()
      )

      expect(result.payload).toEqual({
        licenceNumber: '23210126-2WC3FBP-ABNFA7',
        contact: {
          id: 'a1a91429-deb7-ef11-b8e8-7c1e5237cbf4',
          fullName: 'Brenin Pysgotwr'
        }
      })
      expect(result.statusCode).toBe(200)
    })

    it('should return 403 when no licence is found', async () => {
      executeQuery.mockResolvedValueOnce(null)

      const result = await getFullLicenceHandler(
        getLicenceRequest(),
        getMockResponseToolkit()
      )

      expect(result.statusCode).toBe(403)
    })

    it('should log when no licence is found', async () => {
      executeQuery.mockResolvedValueOnce(null)

      await getFullLicenceHandler(getLicenceRequest(), getMockResponseToolkit())

      expect(logger.info).toHaveBeenCalledWith(
        'Permission not found for 11100420-2WT1SFT-B7A111'
      )
    })

    it('should call handleServerError if an error occurs', async () => {
      const error = new Error('Unexpected error')
      executeQuery.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      await getFullLicenceHandler(getLicenceRequest(), h)

      expect(handleServerError).toHaveBeenCalledWith(
        'Error fetching licence information',
        error,
        h
      )
    })

    it('should return an error response if an error occurs while fetching the licence', async () => {
      const error = new Error('Unexpected error')
      executeQuery.mockRejectedValueOnce(error)

      const result = await getFullLicenceHandler(
        getLicenceRequest(),
        getMockResponseToolkit()
      )

      expect(result).toBe(SERVER_ERROR_SYMBOL)
    })
  })
})
