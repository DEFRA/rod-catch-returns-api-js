import {
  getResponseToolkit,
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
  }
] = routes

describe('methods.unit', () => {
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
    const request = getServerDetails()
    const methods = getFoundMethods()
    Method.findAll.mockResolvedValueOnce(methods)
    const h = getResponseToolkit()

    await getMethodsHandler(request, h)

    expect(h.code).toHaveBeenCalledWith(200)
  })

  it('should return all methods if the call to fetch all methods is successful', async () => {
    const request = getServerDetails()
    const methods = getFoundMethods()
    Method.findAll.mockResolvedValueOnce(methods)
    const h = getResponseToolkit()

    await getMethodsHandler(request, h)

    expect(h.response.mock.calls[0][0]).toMatchSnapshot()
  })

  it('should log an error if an error occurs while fetching methods', async () => {
    const error = new Error('Database error')
    Method.findAll.mockRejectedValueOnce(error)
    const h = getResponseToolkit()

    await getMethodsHandler({}, h)

    expect(logger.error).toHaveBeenCalledWith('Error fetching methods:', error)
  })

  it('should return 500 if an error occurs while fetching methods', async () => {
    const error = new Error('Database error')
    Method.findAll.mockRejectedValueOnce(error)
    const h = getResponseToolkit()

    await getMethodsHandler({}, h)

    expect(h.code).toHaveBeenCalledWith(500)
  })

  it('should return the error response in the body if an error occurs while fetching methods', async () => {
    const error = new Error('Database error')
    Method.findAll.mockRejectedValueOnce(error)
    const h = getResponseToolkit()

    await getMethodsHandler({}, h)

    expect(h.response).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Unable to fetch methods'
      })
    )
  })
})
