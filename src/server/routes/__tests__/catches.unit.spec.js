import {
  getMockResponseToolkit,
  getServerDetails
} from '../../../test-utils/server-test-utils.js'
import { Catch } from '../../../entities/index.js'
import logger from '../../../utils/logger-utils.js'
import routes from '../catches.js'

jest.mock('../../../entities/index.js')
jest.mock('../../../utils/logger-utils.js')

const [
  {
    options: { handler: postCatchHandler }
  }
] = routes

describe('catches.unit', () => {
  describe('POST /catches', () => {
    const getCatchRequest = () => ({
      ...getServerDetails(),
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

    it('should log an error if an error occurs while creating the catch', async () => {
      const error = new Error('Database error')
      Catch.create.mockRejectedValueOnce(error)

      await postCatchHandler(getCatchRequest(), getMockResponseToolkit())

      expect(logger.error).toHaveBeenCalledWith('Error create catch:', error)
    })

    it('should return 500 and error message if an error occurs while creating the catch', async () => {
      const error = new Error('Database error')
      Catch.create.mockRejectedValueOnce(error)

      const result = await postCatchHandler(
        getCatchRequest(),
        getMockResponseToolkit()
      )

      expect(result.payload).toStrictEqual({
        error: 'Unable to create catch'
      })
      expect(result.statusCode).toBe(500)
    })
  })
})
