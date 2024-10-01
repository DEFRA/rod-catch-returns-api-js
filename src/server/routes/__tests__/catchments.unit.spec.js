import { Catchment } from '../../../entities/index.js'
import logger from '../../../utils/logger-utils.js'
import routes from '../catchments.js'

jest.mock('../../../entities/index.js')
jest.mock('../../../utils/logger-utils.js')

describe('catchments.unit', () => {
  describe('GET /catchments', () => {
    const h = {
      response: jest.fn().mockReturnThis(),
      code: jest.fn()
    }

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return all catchments with a 200 status code', async () => {
      const catchmentData = [
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
      Catchment.findAll.mockResolvedValueOnce(catchmentData)

      const handler = routes[0].options.handler
      await handler({}, h)

      expect(Catchment.findAll).toHaveBeenCalled()
      expect(h.response).toHaveBeenCalledWith(
        expect.objectContaining({
          _embedded: {
            catchments: catchmentData
          }
        })
      )
      expect(h.code).toHaveBeenCalledWith(200)
    })

    it('should log and return 500 if an error occurs while catchments', async () => {
      const error = new Error('Database error')
      Catchment.findAll.mockRejectedValueOnce(error)

      const handler = routes[0].options.handler
      await handler({}, h)

      expect(Catchment.findAll).toHaveBeenCalled()
      expect(logger.error).toHaveBeenCalledWith(
        'Error fetching catchments:',
        error
      )
      expect(h.response).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unable to fetch catchments'
        })
      )
      expect(h.code).toHaveBeenCalledWith(500)
    })
  })
})
