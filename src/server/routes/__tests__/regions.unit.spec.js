import { Region } from '../../../entities/index.js'
import logger from '../../../utils/logger-utils.js'
import routes from '../regions.js'

jest.mock('../../../entities/index.js')
jest.mock('../../../utils/logger-utils.js')

describe('regions.unit', () => {
  describe('GET /regions', () => {
    const h = {
      response: jest.fn().mockReturnThis(),
      code: jest.fn()
    }

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return all regions with a 200 status code', async () => {
      const regionsData = [
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
      Region.findAll.mockResolvedValueOnce(regionsData)

      const handler = routes[0].options.handler
      await handler({}, h)

      expect(Region.findAll).toHaveBeenCalled()
      expect(h.response).toHaveBeenCalledWith(
        expect.objectContaining({
          _embedded: {
            regions: regionsData
          }
        })
      )
      expect(h.code).toHaveBeenCalledWith(200)
    })

    it('should log and return 500 if an error occurs while fetching regions', async () => {
      const error = new Error('Database error')
      Region.findAll.mockRejectedValueOnce(error)

      const handler = routes[0].options.handler
      await handler({}, h)

      expect(Region.findAll).toHaveBeenCalled()
      expect(logger.error).toHaveBeenCalledWith(
        'Error fetching regions:',
        error
      )
      expect(h.response).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unable to fetch regions'
        })
      )
      expect(h.code).toHaveBeenCalledWith(500)
    })
  })
})
