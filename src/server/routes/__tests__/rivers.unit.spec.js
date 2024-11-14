import { River } from '../../../entities/index.js'
import logger from '../../../utils/logger-utils.js'
import routes from '../rivers.js'

jest.mock('../../../entities/index.js')
jest.mock('../../../utils/logger-utils.js')

describe('rivers.unit', () => {
  describe('GET /rivers', () => {
    const getRiversHandler = routes[0].options.handler

    const h = {
      response: jest.fn().mockReturnThis(),
      code: jest.fn()
    }

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return all rivers with a 200 status code', async () => {
      const riverData = [
        {
          internal: false,
          id: '1',
          name: 'Aber',
          createdAt: '2018-11-07T10:00:00.000Z',
          updatedAt: '2018-11-07T10:00:00.000Z'
        },
        {
          internal: false,
          id: '2',
          name: 'Adur',
          createdAt: '2018-11-07T10:00:00.000Z',
          updatedAt: '2018-11-07T10:00:00.000Z'
        }
      ]
      River.findAll.mockResolvedValueOnce(riverData)

      await getRiversHandler({}, h)

      expect(River.findAll).toHaveBeenCalled()
      expect(h.response).toHaveBeenCalledWith(
        expect.objectContaining({
          _embedded: {
            rivers: riverData
          }
        })
      )
      expect(h.code).toHaveBeenCalledWith(200)
    })

    it('should log and return 500 if an error occurs while fetching rivers', async () => {
      const error = new Error('Database error')
      River.findAll.mockRejectedValueOnce(error)

      await getRiversHandler({}, h)

      expect(River.findAll).toHaveBeenCalled()
      expect(logger.error).toHaveBeenCalledWith('Error fetching rivers:', error)
      expect(h.response).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unable to fetch rivers'
        })
      )
      expect(h.code).toHaveBeenCalledWith(500)
    })
  })
})
