import {
  getMockResponseToolkit,
  getServerDetails
} from '../../../test-utils/server-test-utils.js'
import {
  handleNotFound,
  handleServerError
} from '../../../utils/server-utils.js'
import { Catch } from '../../../entities/index.js'
import routes from '../catches.js'

jest.mock('../../../entities/index.js')
jest.mock('../../../utils/logger-utils.js')
jest.mock('../../../utils/server-utils.js')

const [
  {
    options: { handler: postCatchHandler }
  },
  {
    options: { handler: getActivityForCatchHandler }
  }
] = routes

const NOT_FOUND_SYMBOL = Symbol('NOT_FOUND')
const SERVER_ERROR_SYMBOL = Symbol('SERVER_ERROR')

handleNotFound.mockReturnValue(NOT_FOUND_SYMBOL)
handleServerError.mockReturnValue(SERVER_ERROR_SYMBOL)

describe('catches.unit', () => {
  describe('POST /catches', () => {
    const getCatchRequest = () =>
      getServerDetails({
        payload: {
          activity: 'activities/404',
          dateCaught: '2024-06-24T00:00:00+01:00',
          species: 'species/1',
          mass: {
            kg: 9.61,
            oz: 339,
            type: 'IMPERIAL'
          },
          method: 'methods/1',
          released: true,
          onlyMonthRecorded: false,
          noDateRecorded: false,
          reportingExclude: false
        }
      })

    const getCreatedCatch = () => ({
      toJSON: jest.fn().mockReturnValue({
        id: '1600',
        activity_id: '404',
        dateCaught: '2024-06-24',
        species_id: '1',
        massType: 'IMPERIAL',
        massOz: 339,
        massKg: 9.610488,
        method_id: '1',
        released: true,
        onlyMonthRecorded: false,
        noDateRecorded: false,
        reportingExclude: false,
        version: '2024-11-18T11:22:36.437Z',
        updatedAt: '2024-11-18T11:22:36.438Z',
        createdAt: '2024-11-18T11:22:36.438Z',
        ActivityId: '404'
      })
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return a 201 status code if the catch is created successfully', async () => {
      Catch.create.mockResolvedValueOnce(getCreatedCatch())

      const result = await postCatchHandler(
        getCatchRequest(),
        getMockResponseToolkit()
      )

      expect(result.statusCode).toBe(201)
    })

    it('should return the created catch if the call to create it is successful', async () => {
      Catch.create.mockResolvedValueOnce(getCreatedCatch())

      const result = await postCatchHandler(
        getCatchRequest(),
        getMockResponseToolkit()
      )

      expect(result.payload).toMatchSnapshot()
    })

    it('should call handleServerError if an error occurs while creating the catch', async () => {
      const error = new Error('Database error')
      Catch.create.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      await postCatchHandler(getCatchRequest(), h)

      expect(handleServerError).toHaveBeenCalledWith(
        'Error creating catch',
        error,
        h
      )
    })

    it('should return an error response if an error occurs while creating the catch', async () => {
      const error = new Error('Database error')
      Catch.create.mockRejectedValueOnce(error)

      const result = await postCatchHandler(
        getCatchRequest(),
        getMockResponseToolkit()
      )

      expect(result).toBe(SERVER_ERROR_SYMBOL)
    })
  })

  describe('GET /catches/{catchId}/activity', () => {
    const getCatchRequest = (catchId) =>
      getServerDetails({
        params: {
          catchId
        }
      })

    const getCatchWithActivity = () => ({
      toJSON: jest.fn().mockReturnValue({
        id: '1',
        dateCaught: '2024-06-24',
        massKg: '9.610488',
        massOz: '339.000000',
        massType: 'IMPERIAL',
        released: true,
        onlyMonthRecorded: false,
        noDateRecorded: false,
        reportingExclude: false,
        createdAt: '2024-11-06T14:25:47.950Z',
        updatedAt: '2024-11-06T14:25:47.950Z',
        version: '2024-11-06T14:25:47.958Z',
        ActivityId: '404',
        activity_id: '404',
        method_id: '1',
        species_id: '1',
        Activity: {
          id: '404',
          daysFishedWithMandatoryRelease: 1,
          daysFishedOther: 0,
          createdAt: '2024-10-18T10:01:25.957Z',
          updatedAt: '2024-10-18T10:01:25.957Z',
          version: '2024-10-18T10:01:25.958Z',
          submission_id: '2802',
          river_id: '5',
          SubmissionId: '2802'
        }
      })
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return a 200 status code and the activity if the catch and activity is found', async () => {
      Catch.findOne.mockResolvedValueOnce(getCatchWithActivity())

      const result = await getActivityForCatchHandler(
        getCatchRequest('1'),
        getMockResponseToolkit()
      )

      expect(result.payload).toMatchSnapshot()
      expect(result.statusCode).toBe(200)
    })

    it('should call handleNotFound if the activity for catch is not found', async () => {
      Catch.findOne.mockResolvedValueOnce(null)
      const h = getMockResponseToolkit()

      await getActivityForCatchHandler(getCatchRequest('nonexistent-id'), h)

      expect(handleNotFound).toHaveBeenCalledWith(
        'Activity not found for catch with ID nonexistent-id',
        h
      )
    })

    it('should return a not found response if the activity for catch is not found', async () => {
      Catch.findOne.mockResolvedValueOnce(null)
      const h = getMockResponseToolkit()

      const result = await getActivityForCatchHandler(
        getCatchRequest('nonexistent-id'),
        h
      )

      expect(result).toBe(NOT_FOUND_SYMBOL)
    })

    it('should call handleServerError if an error occurs while fetching the activity for a catch', async () => {
      const error = new Error('Database error')
      Catch.findOne.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      await getActivityForCatchHandler(getCatchRequest('1'), h)

      expect(handleServerError).toHaveBeenCalledWith(
        'Error fetching activity for catch',
        error,
        h
      )
    })

    it('should an error response if an error occurs while fetching the activity for a catch', async () => {
      const error = new Error('Database error')
      Catch.findOne.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      const result = await getActivityForCatchHandler(getCatchRequest('1'), h)

      expect(result).toBe(SERVER_ERROR_SYMBOL)
    })
  })
})
