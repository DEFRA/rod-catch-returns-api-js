import { Activity } from '../../../entities/index.js'
import logger from '../../../utils/logger-utils.js'
import routes from '../activities.js'

jest.mock('../../../entities/index.js')
jest.mock('../../../utils/logger-utils.js')

describe('activities.unit', () => {
  describe('POST /activities', () => {
    const postActivityHandler = routes[0].options.handler

    const getResponseToolkit = () => ({
      response: jest.fn().mockReturnThis(),
      code: jest.fn()
    })

    const getActivityRequest = () => ({
      info: {
        host: 'localhost:3000'
      },
      server: {
        info: {
          protocol: 'http'
        }
      },
      payload: {
        submission: 'submissions/1',
        daysFishedWithMandatoryRelease: 5,
        daysFishedOther: 10,
        river: 'rivers/2'
      }
    })

    const getCreatedActivity = () => ({
      toJSON: jest.fn().mockReturnValue({
        id: 1,
        daysFishedOther: 10,
        daysFishedWithMandatoryRelease: 5,
        submission_id: '1',
        river_id: '2',
        createdAt: '2024-10-10T13:13:11.000Z',
        updatedAt: '2024-10-10T13:13:11.000Z',
        version: '2024-10-10T13:13:11.000Z'
      })
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return a 201 status code if the activity is created successfully', async () => {
      Activity.create.mockResolvedValueOnce(getCreatedActivity())
      const h = getResponseToolkit()

      await postActivityHandler(getActivityRequest(), h)

      expect(h.code).toHaveBeenCalledWith(201)
    })

    it('should return the created activity if the call to create the activity is successful', async () => {
      Activity.create.mockResolvedValueOnce(getCreatedActivity())
      const h = getResponseToolkit()
      await postActivityHandler(getActivityRequest(), h)

      expect(h.response.mock.calls[0][0]).toMatchSnapshot()
    })

    it('should log an error if an error occurs while creating the activity', async () => {
      const error = new Error('Database error')
      Activity.create.mockRejectedValueOnce(error)
      const h = getResponseToolkit()

      await postActivityHandler(getActivityRequest(), h)

      expect(logger.error).toHaveBeenCalledWith('Error create activity:', error)
    })

    it('should return 500 and error message if an error occurs while creating the activity', async () => {
      const error = new Error('Database error')
      Activity.create.mockRejectedValueOnce(error)
      const h = getResponseToolkit()

      await postActivityHandler(getActivityRequest(), h)

      expect(h.response).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unable to create activity'
        })
      )
      expect(h.code).toHaveBeenCalledWith(500)
    })
  })
})
