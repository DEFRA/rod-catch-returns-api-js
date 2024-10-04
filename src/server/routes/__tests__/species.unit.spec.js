import { Species } from '../../../entities/index.js'
import logger from '../../../utils/logger-utils.js'
import routes from '../species.js'

jest.mock('../../../entities/index.js')
jest.mock('../../../utils/logger-utils.js')

describe('species.unit', () => {
  describe('GET /species', () => {
    const h = {
      response: jest.fn().mockReturnThis(),
      code: jest.fn()
    }

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return all species with a 200 status code', async () => {
      const speciesData = [
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
      Species.findAll.mockResolvedValueOnce(speciesData)

      const handler = routes[0].options.handler
      await handler({}, h)

      expect(Species.findAll).toHaveBeenCalled()
      expect(h.response).toHaveBeenCalledWith(
        expect.objectContaining({
          _embedded: {
            species: speciesData
          }
        })
      )
      expect(h.code).toHaveBeenCalledWith(200)
    })

    it('should log and return 500 if an error occurs while fetching species', async () => {
      const error = new Error('Database error')
      Species.findAll.mockRejectedValueOnce(error)

      const handler = routes[0].options.handler
      await handler({}, h)

      expect(Species.findAll).toHaveBeenCalled()
      expect(logger.error).toHaveBeenCalledWith(
        'Error fetching species:',
        error
      )
      expect(h.response).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unable to fetch species'
        })
      )
      expect(h.code).toHaveBeenCalledWith(500)
    })
  })
})
