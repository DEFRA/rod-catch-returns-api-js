import {
  getMockResponseToolkit,
  getServerDetails
} from '../../../test-utils/server-test-utils.js'
import { Region } from '../../../entities/index.js'
import { handleServerError } from '../../../utils/server-utils.js'
import routes from '../regions.js'

jest.mock('../../../entities/index.js')
jest.mock('../../../utils/server-utils.js')

const [
  {
    options: { handler: getAllRegionsHandler }
  }
] = routes

const SERVER_ERROR_SYMBOL = Symbol('SERVER_ERROR')

handleServerError.mockReturnValue(SERVER_ERROR_SYMBOL)

describe('regions.unit', () => {
  describe('GET /regions', () => {
    const getRegionsData = () => [
      {
        id: '1',
        name: 'Anglian',
        createdAt: '2018-11-07T10:00:00.000Z',
        updatedAt: '2018-11-07T10:00:00.000Z'
      },
      {
        id: '2',
        name: 'Midlands',
        createdAt: '2018-11-07T10:00:00.000Z',
        updatedAt: '2018-11-07T10:00:00.000Z'
      }
    ]

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return a 200 status code if the call to fetch all regions is successful', async () => {
      Region.findAll.mockResolvedValueOnce(getRegionsData())

      const result = await getAllRegionsHandler(
        getServerDetails(),
        getMockResponseToolkit()
      )

      expect(result.statusCode).toBe(200)
    })

    it('should return all regions with a 200 status code if the call to fetch all regions is successful', async () => {
      const regionsData = getRegionsData()
      Region.findAll.mockResolvedValueOnce(regionsData)

      const result = await getAllRegionsHandler(
        getServerDetails(),
        getMockResponseToolkit()
      )

      expect(result.payload).toMatchSnapshot()
    })

    it('should call handleServerError if an error occurs while fetching regions', async () => {
      const error = new Error('Database error')
      Region.findAll.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      await getAllRegionsHandler(getServerDetails(), h)

      expect(handleServerError).toHaveBeenCalledWith(
        'Error fetching regions',
        error,
        h
      )
    })

    it('should return an error response if an error occurs while fetching theregions', async () => {
      const error = new Error('Database error')
      Region.findAll.mockRejectedValueOnce(error)

      const result = await getAllRegionsHandler({}, getMockResponseToolkit)

      expect(result).toBe(SERVER_ERROR_SYMBOL)
    })
  })
})
