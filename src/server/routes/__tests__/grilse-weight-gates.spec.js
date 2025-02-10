import {
  getMockResponseToolkit,
  getServerDetails
} from '../../../test-utils/server-test-utils.js'
import { GrilseWeightGate } from '../../../entities/index.js'
import { handleServerError } from '../../../utils/server-utils.js'
import routes from '../grilse-weight-gates.js'

jest.mock('../../../entities/index.js')
jest.mock('../../../utils/logger-utils.js')
jest.mock('../../../utils/server-utils.js')

const [
  {
    options: { handler: getGrilseWeightGatesHandler }
  }
] = routes

const SERVER_ERROR_SYMBOL = Symbol('SERVER_ERROR')

handleServerError.mockReturnValue(SERVER_ERROR_SYMBOL)

describe('grilse-weight-gates.unit', () => {
  describe('GET /methods', () => {
    const getFoundGrilseWeightGates = () => [
      {
        id: '1',
        internal: false,
        name: 'Dee',
        createdAt: '2018-11-07T10:00:00.000+0000',
        updatedAt: '2018-11-07T10:00:00.000+0000'
      },
      {
        id: '2',
        internal: true,
        name: 'Tamar',
        createdAt: '2018-11-07T10:00:00.000+0000',
        updatedAt: '2018-11-07T10:00:00.000+0000'
      }
    ]

    it('should return a 200 status code if the grilse weight gates are fetched successfully', async () => {
      GrilseWeightGate.findAll.mockResolvedValueOnce(
        getFoundGrilseWeightGates()
      )

      const result = await getGrilseWeightGatesHandler(
        getServerDetails(),
        getMockResponseToolkit()
      )

      expect(result.statusCode).toBe(200)
    })

    it('should return all grilse weight gates if the call to fetch all grilse weight gates is successful', async () => {
      GrilseWeightGate.findAll.mockResolvedValueOnce(
        getFoundGrilseWeightGates()
      )

      const result = await getGrilseWeightGatesHandler(
        getServerDetails(),
        getMockResponseToolkit()
      )

      expect(result.payload).toMatchSnapshot()
    })

    it('should call handleServerError if an error occurs while fetching grilse weight gates', async () => {
      const error = new Error('Database error')
      GrilseWeightGate.findAll.mockRejectedValueOnce(error)

      const h = getMockResponseToolkit()

      await getGrilseWeightGatesHandler(getServerDetails(), h)

      expect(handleServerError).toHaveBeenCalledWith(
        'Error fetching grilse weight gates',
        error,
        h
      )
    })

    it('should return an if an error occurs while fetching grilse weight gates', async () => {
      const error = new Error('Database error')
      GrilseWeightGate.findAll.mockRejectedValueOnce(error)

      const result = await getGrilseWeightGatesHandler(
        getServerDetails(),
        getMockResponseToolkit()
      )

      expect(result).toBe(SERVER_ERROR_SYMBOL)
    })
  })
})
