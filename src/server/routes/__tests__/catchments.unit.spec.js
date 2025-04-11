import {
  getMockResponseToolkit,
  getServerDetails
} from '../../../test-utils/server-test-utils.js'
import { Catchment } from '../../../entities/index.js'
import { handleServerError } from '../../../utils/server-utils.js'
import routes from '../catchments.js'

jest.mock('../../../entities/index.js')
jest.mock('../../../utils/server-utils.js')

const [
  {
    options: { handler: getAllCatchmentsHandler }
  }
] = routes

const SERVER_ERROR_SYMBOL = Symbol('SERVER_ERROR')

handleServerError.mockReturnValue(SERVER_ERROR_SYMBOL)

describe('catchments.unit', () => {
  describe('GET /catchments', () => {
    const getCatchmentData = () => [
      {
        id: '2',
        name: 'Adur',
        createdAt: '2018-11-07T10:00:00.000Z',
        updatedAt: '2018-11-07T10:00:00.000Z'
      },
      {
        id: '6',
        name: 'Annas',
        createdAt: '2018-11-07T10:00:00.000Z',
        updatedAt: '2018-11-07T10:00:00.000Z'
      }
    ]

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return a 200 status code if the call to fetch all catchments is successful', async () => {
      Catchment.findAll.mockResolvedValueOnce(getCatchmentData())

      const result = await getAllCatchmentsHandler(
        getServerDetails(),
        getMockResponseToolkit()
      )

      expect(result.statusCode).toBe(200)
    })

    it('should return all catchments if the call to fetch all catchments is successfull', async () => {
      Catchment.findAll.mockResolvedValueOnce(getCatchmentData())

      const result = await getAllCatchmentsHandler(
        getServerDetails(),
        getMockResponseToolkit()
      )

      expect(result.payload).toMatchSnapshot()
    })

    it('should call handleServerError if an error occurs while fetching the catchments', async () => {
      const error = new Error('Database error')
      Catchment.findAll.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      await getAllCatchmentsHandler(getServerDetails(), h)

      expect(handleServerError).toHaveBeenCalledWith(
        'Error fetching catchments',
        error,
        h
      )
    })

    it('should return the error response if an error occurs while fetching the catchments', async () => {
      const error = new Error('Database error')
      Catchment.findAll.mockRejectedValueOnce(error)

      const result = await getAllCatchmentsHandler(
        getServerDetails(),
        getMockResponseToolkit()
      )

      expect(result).toBe(SERVER_ERROR_SYMBOL)
    })
  })
})
