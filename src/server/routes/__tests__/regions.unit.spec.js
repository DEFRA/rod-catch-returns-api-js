import { Region } from '../../../entities/index.js'
import logger from '../../../utils/logger-utils.js'
import routes from '../regions.js'

jest.mock('../../../entities/index.js')
jest.mock('../../../utils/logger-utils.js')

describe('regions.unit', () => {
  describe('GET /regions', () => {
    const getResponseToolkit = () => ({
      response: jest.fn().mockReturnThis(),
      code: jest.fn()
    })

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

      const handler = routes[0].options.handler
      const h = getResponseToolkit()
      await handler({}, h)

      expect(h.code).toHaveBeenCalledWith(200)
    })

    it('should return all regions with a 200 status code if the call to fetch all regions is successful', async () => {
      const regionsData = getRegionsData()
      Region.findAll.mockResolvedValueOnce(regionsData)

      const handler = routes[0].options.handler
      const h = getResponseToolkit()
      await handler({}, h)

      expect(h.response).toHaveBeenCalledWith(
        expect.objectContaining({
          _embedded: {
            regions: regionsData
          }
        })
      )
    })

    it('should log an error if an error occurs while fetching regions', async () => {
      const error = new Error('Database error')
      Region.findAll.mockRejectedValueOnce(error)

      const handler = routes[0].options.handler
      const h = getResponseToolkit()
      await handler({}, h)

      expect(logger.error).toHaveBeenCalledWith(
        'Error fetching regions:',
        error
      )
    })

    it('should return 500 if an error occurs while fetching regions', async () => {
      const error = new Error('Database error')
      Region.findAll.mockRejectedValueOnce(error)

      const handler = routes[0].options.handler
      const h = getResponseToolkit()
      await handler({}, h)

      expect(h.code).toHaveBeenCalledWith(500)
    })

    it('should return the error response in the body if an error occurs while fetching regions', async () => {
      const error = new Error('Database error')
      Region.findAll.mockRejectedValueOnce(error)

      const handler = routes[0].options.handler
      const h = getResponseToolkit()
      await handler({}, h)

      expect(h.response).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unable to fetch regions'
        })
      )
    })
  })
})
