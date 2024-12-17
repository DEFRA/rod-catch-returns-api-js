import {
  getMockResponseToolkit,
  getServerDetails
} from '../../../test-utils/server-test-utils.js'
import { River } from '../../../entities/index.js'
import { handleServerError } from '../../../utils/server-utils.js'
import routes from '../rivers.js'

jest.mock('../../../entities/index.js')
jest.mock('../../../utils/server-utils.js')

const [
  {
    options: { handler: getAllRiversHandler }
  }
] = routes

const SERVER_ERROR_SYMBOL = Symbol('SERVER_ERROR')

handleServerError.mockReturnValue(SERVER_ERROR_SYMBOL)

describe('rivers.unit', () => {
  describe('GET /rivers', () => {
    afterEach(() => {
      jest.clearAllMocks()
    })

    const getMockRivers = () => [
      {
        internal: false,
        id: '1',
        name: 'Aber',
        createdAt: '2018-11-07T10:00:00.000Z',
        updatedAt: '2018-11-07T10:00:00.000Z',
        version: '2018-11-07T10:00:00.000Z'
      },
      {
        internal: false,
        id: '2',
        name: 'Adur',
        createdAt: '2018-11-07T10:00:00.000Z',
        updatedAt: '2018-11-07T10:00:00.000Z',
        version: '2018-11-07T10:00:00.000Z'
      }
    ]

    it('should return all rivers with a 200 status code', async () => {
      const rivers = getMockRivers()
      River.findAll.mockResolvedValueOnce(rivers)

      const result = await getAllRiversHandler(
        getServerDetails(),
        getMockResponseToolkit()
      )

      expect(result.payload).toMatchSnapshot()
      expect(result.statusCode).toBe(200)
    })

    it('should call handleServerError if an error occurs while fetching the rivers', async () => {
      const error = new Error('Database error')
      River.findAll.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      await getAllRiversHandler(getServerDetails(), h)

      expect(handleServerError).toHaveBeenCalledWith(
        'Error fetching rivers',
        error,
        h
      )
    })

    it('should return an error response if an error occurs while fetching the rivers', async () => {
      const error = new Error('Database error')
      River.findAll.mockRejectedValueOnce(error)

      const result = await getAllRiversHandler(
        getServerDetails(),
        getMockResponseToolkit()
      )

      expect(result).toBe(SERVER_ERROR_SYMBOL)
    })
  })
})
