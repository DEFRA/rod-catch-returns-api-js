import { Catchment } from '../../../entities/index.js'
import logger from '../../../utils/logger-utils.js'
import routes from '../catchments.js'

jest.mock('../../../entities/index.js')
jest.mock('../../../utils/logger-utils.js')

describe('catchments.unit', () => {
  describe('GET /catchments', () => {
    const getCatchmentsHandler = routes[0].options.handler

    const getResponseToolkit = () => ({
      response: jest.fn().mockReturnThis(),
      code: jest.fn()
    })

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
      const h = getResponseToolkit()

      await getCatchmentsHandler({}, h)

      expect(h.code).toHaveBeenCalledWith(200)
    })

    it('should return all catchments if the call to fetch all catchments is successfull', async () => {
      const catchmentData = getCatchmentData()
      Catchment.findAll.mockResolvedValueOnce(catchmentData)
      const h = getResponseToolkit()

      await getCatchmentsHandler({}, h)

      expect(h.response).toHaveBeenCalledWith(
        expect.objectContaining({
          _embedded: {
            catchments: catchmentData
          }
        })
      )
    })

    it('should log an error if an error occurs while fetching catchments', async () => {
      const error = new Error('Database error')
      Catchment.findAll.mockRejectedValueOnce(error)
      const h = getResponseToolkit()

      await getCatchmentsHandler({}, h)

      expect(logger.error).toHaveBeenCalledWith(
        'Error fetching catchments:',
        error
      )
    })

    it('should return 500 if an error occurs while fetching catchments', async () => {
      const error = new Error('Database error')
      Catchment.findAll.mockRejectedValueOnce(error)
      const h = getResponseToolkit()

      await getCatchmentsHandler({}, h)

      expect(h.response).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unable to fetch catchments'
        })
      )
    })

    it('should return the error response in the body if an error occurs while fetching catchments', async () => {
      const error = new Error('Database error')
      Catchment.findAll.mockRejectedValueOnce(error)
      const h = getResponseToolkit()

      await getCatchmentsHandler({}, h)

      expect(h.response).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unable to fetch catchments'
        })
      )
    })
  })
})
