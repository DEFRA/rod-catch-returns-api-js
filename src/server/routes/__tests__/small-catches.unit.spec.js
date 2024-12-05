import {
  getMockResponseToolkit,
  getServerDetails
} from '../../../test-utils/server-test-utils.js'
import {
  handleNotFound,
  handleServerError
} from '../../../utils/server-utils.js'
import { SmallCatch } from '../../../entities/index.js'
import routes from '../small-catches.js'

jest.mock('../../../entities/index.js')
jest.mock('../../../utils/logger-utils.js')
jest.mock('../../../utils/server-utils.js')

const [
  {
    options: { handler: postSmallCatchHandler }
  },
  {
    options: { handler: getActivityForSmallCatchHandler }
  }
] = routes

const NOT_FOUND_SYMBOL = Symbol('NOT_FOUND')
const SERVER_ERROR_SYMBOL = Symbol('SERVER_ERROR')

handleNotFound.mockReturnValue(NOT_FOUND_SYMBOL)
handleServerError.mockReturnValue(SERVER_ERROR_SYMBOL)

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
        id: '1',
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

      const result = await postSmallCatchHandler(
        getSmallCatchRequest(),
        getMockResponseToolkit()
      )

      expect(result.statusCode).toBe(201)
    })

    it('should return the created small catch if the call to create it is successful', async () => {
      SmallCatch.create.mockResolvedValueOnce(getCreatedSmallCatch())

      const result = await postSmallCatchHandler(
        getSmallCatchRequest(),
        getMockResponseToolkit()
      )

      expect(result.payload).toMatchSnapshot()
    })

    it('should call handleServerError if an error occurs while creating the small catch', async () => {
      const error = new Error('Database error')
      SmallCatch.create.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      await postSmallCatchHandler(getSmallCatchRequest(), h)

      expect(handleServerError).toHaveBeenCalledWith(
        'Error creating small catch',
        error,
        h
      )
    })

    it('should return an error response if an error occurs while creating the small catch', async () => {
      const error = new Error('Database error')
      SmallCatch.create.mockRejectedValueOnce(error)

      const result = await postSmallCatchHandler(
        getSmallCatchRequest(),
        getMockResponseToolkit()
      )

      expect(result).toBe(SERVER_ERROR_SYMBOL)
    })
  })

  describe('GET /smallCatches/{smallCatchId}/activity', () => {
    const getSmallCatchRequest = (smallCatchId) =>
      getServerDetails({
        params: {
          smallCatchId
        }
      })

    const getSmallCatchWithActivity = () => ({
      toJSON: jest.fn().mockReturnValue({
        id: '1',
        month: 1,
        released: 1,
        reportingExclude: false,
        noMonthRecorded: false,
        createdAt: '2024-10-10T13:27:41.096Z',
        updatedAt: '2024-10-10T13:27:41.096Z',
        version: '2024-10-10T13:27:41.097Z',
        ActivityId: '3',
        activity_id: '3',
        Activity: {
          id: '3',
          daysFishedWithMandatoryRelease: 1,
          daysFishedOther: 0,
          createdAt: '2024-10-10T13:26:30.344Z',
          updatedAt: '2024-10-10T13:26:30.344Z',
          version: '2024-10-10T13:26:30.345Z',
          submission_id: '2802',
          river_id: '104',
          SubmissionId: '2802'
        }
      })
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return a 200 status code and the activity if the small catch and activity is found', async () => {
      SmallCatch.findOne.mockResolvedValueOnce(getSmallCatchWithActivity())

      const result = await getActivityForSmallCatchHandler(
        getSmallCatchRequest('1'),
        getMockResponseToolkit()
      )

      expect(result.payload).toMatchSnapshot()
      expect(result.statusCode).toBe(200)
    })

    it('should call handleNotFound if the activity for the small catch is not found', async () => {
      SmallCatch.findOne.mockResolvedValueOnce(null)
      const h = getMockResponseToolkit()

      await getActivityForSmallCatchHandler(
        getSmallCatchRequest('nonexistent-id'),
        h
      )

      expect(handleNotFound).toHaveBeenCalledWith(
        'Activity not found for small catch with ID nonexistent-id',
        h
      )
    })

    it('should return a not found response if the activity for the small catch is not found', async () => {
      SmallCatch.findOne.mockResolvedValueOnce(null)
      const h = getMockResponseToolkit()

      const result = await getActivityForSmallCatchHandler(
        getSmallCatchRequest('nonexistent-id'),
        h
      )

      expect(result).toBe(NOT_FOUND_SYMBOL)
    })

    it('should call handleServerError if an error occurs while fetching the activity for the small catch', async () => {
      const error = new Error('Database error')
      SmallCatch.findOne.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      await getActivityForSmallCatchHandler(getSmallCatchRequest('1'), h)

      expect(handleServerError).toHaveBeenCalledWith(
        'Error fetching activity for small catch',
        error,
        h
      )
    })

    it('should an error response if an error occurs while fetching the activity for the small catch', async () => {
      const error = new Error('Database error')
      SmallCatch.findOne.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      const result = await getActivityForSmallCatchHandler(
        getSmallCatchRequest('1'),
        h
      )

      expect(result).toBe(SERVER_ERROR_SYMBOL)
    })
  })
})
