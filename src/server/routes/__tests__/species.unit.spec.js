import { Species } from '../../../entities/index.js'
import logger from '../../../utils/logger-utils.js'
import routes from '../species.js'

jest.mock('../../../entities/index.js')
jest.mock('../../../utils/logger-utils.js')

describe('species.unit', () => {
  describe('GET /species', () => {
    const getResponseToolkit = () => ({
      response: jest.fn().mockReturnThis(),
      code: jest.fn()
    })

    const getSpeciesData = () => [
      {
        id: '1',
        name : 'Salmon',
        smallCatchMass : 0.396893,
        createdAt : '2018-11-07T10:00:00.000+0000',
        updatedAt : '2018-11-07T10:00:00.000+0000'
      },
      {
        id: '2',
        name : 'Sea Trout',
        smallCatchMass : 0.396893,
        createdAt : '2018-11-07T10:00:00.000+0000',
        updatedAt : '2018-11-07T10:00:00.000+0000'
      }
    ]

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return a 200 status code if the call to fetch all species is successful', async () => {
      Species.findAll.mockResolvedValueOnce(getSpeciesData())

      const handler = routes[0].options.handler
      const h = getResponseToolkit()
      await handler({}, h)

      expect(h.code).toHaveBeenCalledWith(200)
    })

    it('should return all species if the call to fetch all species is successfu', async () => {
      const speciesData = getSpeciesData()
      Species.findAll.mockResolvedValueOnce(speciesData)

      const handler = routes[0].options.handler
      const h = getResponseToolkit()
      await handler({}, h)

      expect(h.response).toHaveBeenCalledWith(
        expect.objectContaining({
          _embedded: {
            species: speciesData
          }
        })
      )
    })

    it('should log an error if an error occurs while fetching species', async () => {
      const error = new Error('Database error')
      Species.findAll.mockRejectedValueOnce(error)

      const handler = routes[0].options.handler
      const h = getResponseToolkit()
      await handler({}, h)

      expect(logger.error).toHaveBeenCalledWith(
        'Error fetching species:',
        error
      )
    })

    it('should return 500 if an error occurs while fetching species', async () => {
      const error = new Error('Database error')
      Species.findAll.mockRejectedValueOnce(error)

      const handler = routes[0].options.handler
      const h = getResponseToolkit()
      await handler({}, h)

      expect(h.code).toHaveBeenCalledWith(500)
    })

    it('should return the error response in the body if an error occurs while fetching species', async () => {
      const error = new Error('Database error')
      Species.findAll.mockRejectedValueOnce(error)

      const handler = routes[0].options.handler
      const h = getResponseToolkit()
      await handler({}, h)

      expect(h.response).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unable to fetch species'
        })
      )
    })
  })
})
