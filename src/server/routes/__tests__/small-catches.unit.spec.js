import {
  getResponseToolkit,
  getServerDetails
} from '../../../test-utils/server-test-utils.js'
import { SmallCatch } from '../../../entities/index.js'
import logger from '../../../utils/logger-utils.js'
import routes from '../small-catches.js'

jest.mock('../../../entities/index.js')
jest.mock('../../../utils/logger-utils.js')

const [
  {
    options: { handler: postSmallCatchHandler }
  }
] = routes

describe('smallCatches.unit', () => {
  describe('POST /smallCatches', () => {
    const getSmallCatchRequest = () => ({
      ...getServerDetails(),
      payload: {
        submission: 'submissions/2802',
        activity: 'activities/3',
        month: 'FEBRUARY',
        released: '3',
        counts: [
          { method: 'methods/1', count: '3' },
          { method: 'methods/2', count: '2' },
          { method: 'methods/3', count: '1' }
        ],
        noMonthRecorded: false,
        reportingExclude: false
      }
    })

    const getCreatedSmallCatch = () => ({
      toJSON: jest.fn().mockReturnValue({
        id: 1,
        month: 2,
        released: 3,
        counts: [
          {
            count: 3,
            method_id: 1
          },
          {
            count: 2,
            method_id: 2
          },
          {
            count: 1,
            method_id: 3
          }
        ],
        activity_id: 3,
        noMonthRecorded: false,
        reportingExclude: false,
        createdAt: '2024-10-11T09:30:57.463+0000',
        updatedAt: '2024-10-11T09:30:57.463+0000',
        version: '2024-10-11T09:30:57.463+0000'
      })
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return a 201 status code if the small catch is created successfully', async () => {
      SmallCatch.create.mockResolvedValueOnce(getCreatedSmallCatch())
      const h = getResponseToolkit()

      await postSmallCatchHandler(getSmallCatchRequest(), h)

      expect(h.code).toHaveBeenCalledWith(201)
    })

    it('should return the created small catch if the call to create it is successful', async () => {
      SmallCatch.create.mockResolvedValueOnce(getCreatedSmallCatch())
      const h = getResponseToolkit()

      await postSmallCatchHandler(getSmallCatchRequest(), h)

      expect(h.response.mock.calls[0][0]).toMatchSnapshot()
    })

    it('should log an error if an error occurs while creating the small catch', async () => {
      const error = new Error('Database error')
      SmallCatch.create.mockRejectedValueOnce(error)
      const h = getResponseToolkit()

      await postSmallCatchHandler(getSmallCatchRequest(), h)

      expect(logger.error).toHaveBeenCalledWith(
        'Error create small catch:',
        error
      )
    })

    it('should return 500 and error message if an error occurs while creating the small catch', async () => {
      const error = new Error('Database error')
      SmallCatch.create.mockRejectedValueOnce(error)
      const h = getResponseToolkit()

      await postSmallCatchHandler(getSmallCatchRequest(), h)

      expect(h.response).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unable to create small catch'
        })
      )
      expect(h.code).toHaveBeenCalledWith(500)
    })
  })
})
