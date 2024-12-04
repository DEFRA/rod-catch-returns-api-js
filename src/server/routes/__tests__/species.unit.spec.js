import {
  getMockResponseToolkit,
  getServerDetails
} from '../../../test-utils/server-test-utils.js'
import { Species } from '../../../entities/index.js'
import { handleServerError } from '../../../utils/server-utils.js'
import routes from '../species.js'

jest.mock('../../../entities/index.js')
jest.mock('../../../utils/logger-utils.js')
jest.mock('../../../utils/server-utils.js')

const [
  {
    options: { handler: getAllSpeciesHandler }
  }
] = routes

const SERVER_ERROR_SYMBOL = Symbol('SERVER_ERROR')

handleServerError.mockReturnValue(SERVER_ERROR_SYMBOL)

describe('species.unit', () => {
  describe('GET /species', () => {
    const getSpeciesData = () => [
      {
        id: '1',
        name: 'Salmon',
        smallCatchMass: 0.396893,
        createdAt: '2018-11-07T10:00:00.000+0000',
        updatedAt: '2018-11-07T10:00:00.000+0000'
      },
      {
        id: '2',
        name: 'Sea Trout',
        smallCatchMass: 0.396893,
        createdAt: '2018-11-07T10:00:00.000+0000',
        updatedAt: '2018-11-07T10:00:00.000+0000'
      }
    ]

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return a 200 status code and the species if the call to fetch all species is successful', async () => {
      Species.findAll.mockResolvedValueOnce(getSpeciesData())

      const result = await getAllSpeciesHandler(
        getServerDetails(),
        getMockResponseToolkit()
      )

      expect(result.payload).toMatchSnapshot()
      expect(result.statusCode).toBe(200)
    })

    it('should call handleServerError if an error occurs while fetching species', async () => {
      const error = new Error('Database error')
      Species.findAll.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      await getAllSpeciesHandler(getServerDetails(), h)

      expect(handleServerError).toHaveBeenCalledWith(
        'Error fetching species',
        error,
        h
      )
    })

    it('should an error response if an error occurs while fetching species', async () => {
      const error = new Error('Database error')
      Species.findAll.mockRejectedValueOnce(error)

      const result = await getAllSpeciesHandler(
        getServerDetails(),
        getMockResponseToolkit()
      )

      expect(result).toBe(SERVER_ERROR_SYMBOL)
    })
  })
})
