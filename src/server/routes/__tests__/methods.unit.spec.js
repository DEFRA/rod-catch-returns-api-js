import {
  getMockResponseToolkit,
  getServerDetails
} from '../../../test-utils/server-test-utils.js'
import {
  handleNotFound,
  handleServerError
} from '../../../utils/server-utils.js'
import { Method } from '../../../entities/index.js'
import routes from '../methods.js'

jest.mock('../../../entities/index.js')
jest.mock('../../../utils/server-utils.js')

const [
  {
    options: { handler: getMethodsHandler }
  },
  {
    options: { handler: getMethodByIdHandler }
  }
] = routes

const NOT_FOUND_SYMBOL = Symbol('NOT_FOUND')
const SERVER_ERROR_SYMBOL = Symbol('SERVER_ERROR')

handleNotFound.mockReturnValue(NOT_FOUND_SYMBOL)
handleServerError.mockReturnValue(SERVER_ERROR_SYMBOL)

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

    it('should call handleServerError if an error occurs while fetching methods', async () => {
      const error = new Error('Database error')
      Method.findAll.mockRejectedValueOnce(error)

      const h = getMockResponseToolkit()

      await getMethodsHandler(getServerDetails(), h)

      expect(handleServerError).toHaveBeenCalledWith(
        'Error fetching methods',
        error,
        h
      )
    })

    it('should return an error response if an error occurs while fetching methods', async () => {
      const error = new Error('Database error')
      Method.findAll.mockRejectedValueOnce(error)

      const result = await getMethodsHandler(
        getServerDetails(),
        getMockResponseToolkit()
      )

      expect(result).toBe(SERVER_ERROR_SYMBOL)
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

    it('should call handleNotFound if the requested method does not exist', async () => {
      Method.findOne.mockResolvedValueOnce(undefined)
      const h = getMockResponseToolkit()

      await getMethodByIdHandler(getMethodRequest(), h)

      expect(handleNotFound).toHaveBeenCalledWith(
        'Method not found for id 1',
        h
      )
    })

    it('should return a not found reqponse if the requested method does not exist', async () => {
      Method.findOne.mockResolvedValueOnce(undefined)

      const result = await getMethodByIdHandler(
        getMethodRequest(),
        getMockResponseToolkit()
      )

      expect(result).toBe(NOT_FOUND_SYMBOL)
    })

    it('should call handleServerError if an error occurs while fetching the method', async () => {
      const error = new Error('Database error')
      Method.findOne.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      await getMethodByIdHandler(getMethodRequest(), h)

      expect(handleServerError).toHaveBeenCalledWith(
        'Error fetching method',
        error,
        h
      )
    })

    it('should return an error response if an error occurs while fetching the method', async () => {
      const error = new Error('Database error')
      Method.findOne.mockRejectedValueOnce(error)

      const result = await getMethodByIdHandler(
        getMethodRequest(),
        getMockResponseToolkit()
      )

      expect(result).toBe(SERVER_ERROR_SYMBOL)
    })
  })
})
