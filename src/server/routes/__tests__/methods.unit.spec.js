import {
  getMockResponseToolkit,
  getServerDetails
} from '../../../test-utils/server-test-utils.js'
import { Method } from '../../../entities/index.js'
import logger from '../../../utils/logger-utils.js'
import routes from '../methods.js'

jest.mock('../../../entities/index.js')
jest.mock('../../../utils/logger-utils.js')

const [
  {
    options: { handler: getMethodsHandler }
  },
  {
    options: { handler: getMethodByIdHandler }
  }
] = routes

describe('methods.unit', () => {
  describe('GET /methods', () => {
    const getFoundMethods = () => [
      {
        toJSON: jest.fn().mockReturnValue({
          id: '1',
          internal: false,
          name: 'Fly',
          createdAt: '2018-11-07T10:00:00.000+0000',
          updatedAt: '2018-11-07T10:00:00.000+0000'
        })
      },
      {
        toJSON: jest.fn().mockReturnValue({
          id: '2',
          internal: true,
          name: 'Unknown',
          createdAt: '2018-11-07T10:00:00.000+0000',
          updatedAt: '2018-11-07T10:00:00.000+0000'
        })
      }
    ]

    it('should return a 200 status code if the methods are fetched successfully', async () => {
      Method.findAll.mockResolvedValueOnce(getFoundMethods())

      const result = await getMethodsHandler(
        getServerDetails(),
        getMockResponseToolkit()
      )

      expect(result.statusCode).toBe(200)
    })

    it('should return all methods if the call to fetch all methods is successful', async () => {
      Method.findAll.mockResolvedValueOnce(getFoundMethods())

      const result = await getMethodsHandler(
        getServerDetails(),
        getMockResponseToolkit()
      )

      expect(result.payload).toMatchSnapshot()
    })

    it('should log an error if an error occurs while fetching methods', async () => {
      const error = new Error('Database error')
      Method.findAll.mockRejectedValueOnce(error)

      await getMethodsHandler(getServerDetails(), getMockResponseToolkit())

      expect(logger.error).toHaveBeenCalledWith(
        'Error fetching methods:',
        error
      )
    })

    it('should return 500 if an error occurs while fetching methods', async () => {
      Method.findAll.mockRejectedValueOnce(new Error('Database error'))

      const result = await getMethodsHandler(
        getServerDetails(),
        getMockResponseToolkit()
      )

      expect(result.statusCode).toBe(500)
    })

    it('should return the error response in the body if an error occurs while fetching methods', async () => {
      Method.findAll.mockRejectedValueOnce(new Error('Database error'))

      const result = await getMethodsHandler(
        getServerDetails(),
        getMockResponseToolkit()
      )

      expect(result.payload).toStrictEqual({
        error: 'Unable to fetch methods'
      })
    })
  })

  describe('GET /methods/{methodId}', () => {
    const getFoundMethod = () => ({
      toJSON: jest.fn().mockReturnValue({
        id: '1',
        internal: false,
        name: 'Fly',
        createdAt: '2018-11-07T10:00:00.000+0000',
        updatedAt: '2018-11-07T10:00:00.000+0000'
      })
    })

    const getMethodRequest = () =>
      getServerDetails({
        params: {
          methodId: '1'
        }
      })

    it('should return a 200 status code if the method are fetched successfully', async () => {
      Method.findOne.mockResolvedValueOnce(getFoundMethod())

      const result = await getMethodByIdHandler(
        getMethodRequest(),
        getMockResponseToolkit()
      )

      expect(result.statusCode).toBe(200)
    })

    it('should return the requested method if the call to fetch the method is successful', async () => {
      Method.findOne.mockResolvedValueOnce(getFoundMethod())

      const result = await getMethodByIdHandler(
        getMethodRequest(),
        getMockResponseToolkit()
      )

      expect(result.payload).toStrictEqual({
        _links: {
          method: {
            href: 'http://localhost:3000/api/methods/1'
          },
          self: {
            href: 'http://localhost:3000/api/methods/1'
          }
        },
        createdAt: expect.any(String),
        id: '1',
        internal: false,
        name: 'Fly',
        updatedAt: expect.any(String)
      })
    })

    it('should return a 404 and an empty body if the requested method does not exists', async () => {
      Method.findOne.mockResolvedValueOnce(undefined)

      const result = await getMethodByIdHandler(
        getMethodRequest(),
        getMockResponseToolkit()
      )

      expect(result.payload).toBeUndefined()
      expect(result.statusCode).toBe(404)
    })

    it('should log an error if an error occurs while fetching the method', async () => {
      const error = new Error('Database error')
      Method.findOne.mockRejectedValueOnce(error)

      await getMethodByIdHandler(getMethodRequest(), getMockResponseToolkit())

      expect(logger.error).toHaveBeenCalledWith('Error fetching method:', error)
    })

    it('should return 500 if an error occurs while fetching the method', async () => {
      Method.findOne.mockRejectedValueOnce(new Error('Database error'))

      const result = await getMethodByIdHandler(
        getMethodRequest(),
        getMockResponseToolkit()
      )

      expect(result.statusCode).toBe(500)
    })

    it('should return the error response in the body if an error occurs while fetching methods', async () => {
      Method.findOne.mockRejectedValueOnce(new Error('Database error'))

      const result = await getMethodByIdHandler(
        getMethodRequest(),
        getMockResponseToolkit()
      )

      expect(result.payload).toStrictEqual({
        error: 'Unable to fetch method'
      })
    })
  })
})
