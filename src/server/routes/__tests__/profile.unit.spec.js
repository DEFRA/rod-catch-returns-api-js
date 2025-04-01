import {
  getMockResponseToolkit,
  getServerDetails
} from '../../../test-utils/server-test-utils.js'
import { handleServerError } from '../../../utils/server-utils.js'
import routes from '../profile.js'

jest.mock('../../../entities/index.js')
jest.mock('../../../utils/server-utils.js')

const [
  {
    options: { handler: getProfileHandler }
  }
] = routes

const SERVER_ERROR_SYMBOL = Symbol('SERVER_ERROR')

handleServerError.mockReturnValue(SERVER_ERROR_SYMBOL)

describe('profile.unit', () => {
  describe('GET /profile', () => {
    it('should return a 200 status code if the list of urls are fetched successfully', async () => {
      const mockRoutes = [
        { method: 'GET', path: '/api/catches/{catchId}"' },
        { method: 'POST', path: '/api/activities' }
      ]

      const request = getServerDetails({
        server: {
          info: { protocol: 'http' },
          table: jest.fn().mockReturnValue(mockRoutes)
        }
      })

      const result = await getProfileHandler(request, getMockResponseToolkit())

      expect(result.statusCode).toBe(200)
      expect(result.payload).toEqual({
        urls: [
          { method: 'GET', path: '/api/catches/{catchId}"' },
          { method: 'POST', path: '/api/activities' }
        ]
      })
    })

    it('should call handleServerError if an error occurs while getting the list of urls methods', async () => {
      const error = new Error('error')
      const request = getServerDetails({
        server: {
          info: { protocol: 'http' },
          table: jest.fn().mockImplementation(error)
        }
      })
      const h = getMockResponseToolkit()

      await getProfileHandler(request, h)

      expect(handleServerError).toHaveBeenCalledWith(
        'Error fetching profile',
        error,
        h
      )
    })
  })
})
