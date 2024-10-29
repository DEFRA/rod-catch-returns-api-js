import {
  getResponseToolkit,
  getServerDetails
} from '../../../test-utils/server-test-utils.js'
import { Activity } from '../../../entities/index.js'
import logger from '../../../utils/logger-utils.js'
import routes from '../activities.js'

jest.mock('../../../entities/index.js')
jest.mock('../../../utils/logger-utils.js')

const [
  {
    options: { handler: postActivityHandler }
  },
  {
    options: { handler: getRiverForActivityHandler }
  }
] = routes

describe('activities.unit', () => {
  describe('POST /activities', () => {
    const getActivityRequest = () => ({
      ...getServerDetails(),
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

  describe('GET /activities/{activityId}/river', () => {
    const getActivityRequest = (activityId) => ({
      ...getServerDetails(),
      params: {
        activityId
      }
    })

    const getActivityWithRiver = () => ({
      River: {
        toJSON: jest.fn().mockReturnValue({
          id: 2,
          internal: false,
          name: 'River Test',
          createdAt: '2024-10-10T13:13:11.000Z',
          updatedAt: '2024-10-10T13:13:11.000Z',
          version: '2024-10-10T13:13:11.000Z'
        })
      }
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return a 200 status code and the river if the activity is found', async () => {
      Activity.findOne.mockResolvedValueOnce(getActivityWithRiver())
      const h = getResponseToolkit()

      await getRiverForActivityHandler(getActivityRequest('1'), h)

      expect(h.code).toHaveBeenCalledWith(200)
      expect(h.response).toHaveBeenCalledWith({
        id: 2,
        internal: false,
        name: 'River Test',
        createdAt: '2024-10-10T13:13:11.000Z',
        updatedAt: '2024-10-10T13:13:11.000Z',
        version: '2024-10-10T13:13:11.000Z',
        _links: {
          catchment: {
            href: 'http://localhost:3000/api/rivers/2/catchment'
          },
          river: {
            href: 'http://localhost:3000/api/rivers/2'
          },
          self: {
            href: 'http://localhost:3000/api/rivers/2'
          }
        }
      })
    })

    it('should return 404 if the activity is not found', async () => {
      Activity.findOne.mockResolvedValueOnce(null)
      const h = getResponseToolkit()

      await getRiverForActivityHandler(getActivityRequest('nonexistent-id'), h)

      expect(h.code).toHaveBeenCalledWith(404)
      expect(h.response).toHaveBeenCalledWith()
    })

    it('should log an error if an error occurs while fetching the river for the activity', async () => {
      const error = new Error('Database error')
      Activity.findOne.mockRejectedValueOnce(error)
      const h = getResponseToolkit()

      await getRiverForActivityHandler(getActivityRequest('1'), h)

      expect(logger.error).toHaveBeenCalledWith(
        'Error fetching river for activity:',
        error
      )
    })

    it('should return 500 and error message if an error occurs while fetching the river', async () => {
      const error = new Error('Database error')
      Activity.findOne.mockRejectedValueOnce(error)
      const h = getResponseToolkit()

      await getRiverForActivityHandler(getActivityRequest('1'), h)

      expect(h.code).toHaveBeenCalledWith(500)
      expect(h.response).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unable to fetch river for activity'
        })
      )
    })
  })
})
