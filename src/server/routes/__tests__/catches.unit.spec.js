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
  },
  {
    options: { handler: getSpeciesForCatchHandler }
  },
  {
    options: { handler: getMethodForCatchHandler }
  },
  {
    options: { handler: getCatchHandler }
  },
  {
    options: { handler: deleteCatchHandler }
  },
  {
    options: { handler: patchCatchHandler }
  }
] = routes

const NOT_FOUND_SYMBOL = Symbol('NOT_FOUND')
const SERVER_ERROR_SYMBOL = Symbol('SERVER_ERROR')

handleNotFound.mockReturnValue(NOT_FOUND_SYMBOL)
handleServerError.mockReturnValue(SERVER_ERROR_SYMBOL)

describe('catches.unit', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

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

  describe('GET /catches/{catchId}/species', () => {
    const getCatchRequest = (catchId) =>
      getServerDetails({
        params: {
          catchId
        }
      })

    const getCatchWithSpecies = () => ({
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
        Species: {
          id: '1',
          name: 'Salmon',
          smallCatchMass: '0.396893',
          createdAt: '2018-11-07T10:00:00.000Z',
          updatedAt: '2018-11-07T10:00:00.000Z'
        }
      })
    })

    it('should return a 200 status code and the species if the catch and species is found', async () => {
      Catch.findOne.mockResolvedValueOnce(getCatchWithSpecies())

      const result = await getSpeciesForCatchHandler(
        getCatchRequest('1'),
        getMockResponseToolkit()
      )

      expect(result.payload).toMatchSnapshot()
      expect(result.statusCode).toBe(200)
    })

    it('should call handleNotFound if the species for the catch is not found', async () => {
      Catch.findOne.mockResolvedValueOnce(null)
      const h = getMockResponseToolkit()

      await getSpeciesForCatchHandler(getCatchRequest('nonexistent-id'), h)

      expect(handleNotFound).toHaveBeenCalledWith(
        'Species not found for catch with ID nonexistent-id',
        h
      )
    })

    it('should return a not found response if the species the for catch is not found', async () => {
      Catch.findOne.mockResolvedValueOnce(null)
      const h = getMockResponseToolkit()

      const result = await getSpeciesForCatchHandler(
        getCatchRequest('nonexistent-id'),
        h
      )

      expect(result).toBe(NOT_FOUND_SYMBOL)
    })

    it('should call handleServerError if an error occurs while fetching the species for a catch', async () => {
      const error = new Error('Database error')
      Catch.findOne.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      await getSpeciesForCatchHandler(getCatchRequest('1'), h)

      expect(handleServerError).toHaveBeenCalledWith(
        'Error fetching species for catch',
        error,
        h
      )
    })

    it('should an error response if an error occurs while fetching the species for a catch', async () => {
      const error = new Error('Database error')
      Catch.findOne.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      const result = await getSpeciesForCatchHandler(getCatchRequest('1'), h)

      expect(result).toBe(SERVER_ERROR_SYMBOL)
    })
  })

  describe('GET /catches/{catchId}/method', () => {
    const getCatchRequest = (catchId) =>
      getServerDetails({
        params: {
          catchId
        }
      })

    const getCatchWithMethod = () => ({
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
        Method: {
          id: '1',
          name: 'Fly',
          internal: false,
          createdAt: '2018-11-07T10:00:00.000Z',
          updatedAt: '2018-11-07T10:00:00.000Z'
        }
      })
    })

    it('should return a 200 status code and the method if the catch and method is found', async () => {
      Catch.findOne.mockResolvedValueOnce(getCatchWithMethod())

      const result = await getMethodForCatchHandler(
        getCatchRequest('1'),
        getMockResponseToolkit()
      )

      expect(result.payload).toMatchSnapshot()
      expect(result.statusCode).toBe(200)
    })

    it('should call handleNotFound if the method for the catch is not found', async () => {
      Catch.findOne.mockResolvedValueOnce(null)
      const h = getMockResponseToolkit()

      await getMethodForCatchHandler(getCatchRequest('nonexistent-id'), h)

      expect(handleNotFound).toHaveBeenCalledWith(
        'Method not found for catch with ID nonexistent-id',
        h
      )
    })

    it('should return a not found response if the method the for catch is not found', async () => {
      Catch.findOne.mockResolvedValueOnce(null)
      const h = getMockResponseToolkit()

      const result = await getMethodForCatchHandler(
        getCatchRequest('nonexistent-id'),
        h
      )

      expect(result).toBe(NOT_FOUND_SYMBOL)
    })

    it('should call handleServerError if an error occurs while fetching the method for a catch', async () => {
      const error = new Error('Database error')
      Catch.findOne.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      await getMethodForCatchHandler(getCatchRequest('1'), h)

      expect(handleServerError).toHaveBeenCalledWith(
        'Error fetching method for catch',
        error,
        h
      )
    })

    it('should an error response if an error occurs while fetching the method for a catch', async () => {
      const error = new Error('Database error')
      Catch.findOne.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      const result = await getMethodForCatchHandler(getCatchRequest('1'), h)

      expect(result).toBe(SERVER_ERROR_SYMBOL)
    })
  })

  describe('GET /catches/{catchId}', () => {
    const getCatchRequest = (catchId) =>
      getServerDetails({
        params: {
          catchId
        }
      })

    const getCatch = () => ({
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
        species_id: '1'
      })
    })

    it('should return a 200 status code and the catch if it is found', async () => {
      Catch.findOne.mockResolvedValueOnce(getCatch())

      const result = await getCatchHandler(
        getCatchRequest('1'),
        getMockResponseToolkit()
      )

      expect(result.payload).toMatchSnapshot()
      expect(result.statusCode).toBe(200)
    })

    it('should call handleNotFound if the catch is not found', async () => {
      Catch.findOne.mockResolvedValueOnce(null)
      const h = getMockResponseToolkit()

      await getCatchHandler(getCatchRequest('nonexistent-id'), h)

      expect(handleNotFound).toHaveBeenCalledWith(
        'Catch not found for ID: nonexistent-id',
        h
      )
    })

    it('should return a not found response if the catch is not found', async () => {
      Catch.findOne.mockResolvedValueOnce(null)
      const h = getMockResponseToolkit()

      const result = await getCatchHandler(getCatchRequest('nonexistent-id'), h)

      expect(result).toBe(NOT_FOUND_SYMBOL)
    })

    it('should call handleServerError if an error occurs while fetching the catch', async () => {
      const error = new Error('Database error')
      Catch.findOne.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      await getCatchHandler(getCatchRequest('1'), h)

      expect(handleServerError).toHaveBeenCalledWith(
        'Error fetching catch by ID',
        error,
        h
      )
    })

    it('should return an error response if an error occurs while fetching the the catch', async () => {
      const error = new Error('Database error')
      Catch.findOne.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      const result = await getCatchHandler(getCatchRequest('1'), h)

      expect(result).toBe(SERVER_ERROR_SYMBOL)
    })
  })

  describe('DELETE /catches/{catchId}', () => {
    const getDeleteRequest = (catchId) =>
      getServerDetails({
        params: {
          catchId
        }
      })

    it('should return a 204 status code if the catch is deleted successfully', async () => {
      Catch.destroy.mockResolvedValueOnce(1)

      const result = await deleteCatchHandler(
        getDeleteRequest('2'),
        getMockResponseToolkit()
      )

      expect(result.statusCode).toBe(204)
    })

    it('should return an empty response body when the catch is deleted successfully', async () => {
      Catch.destroy.mockResolvedValueOnce(1)

      const result = await deleteCatchHandler(
        getDeleteRequest('2'),
        getMockResponseToolkit()
      )

      expect(result.payload).toBeUndefined()
    })

    it('should call handleNotFound if no catch is found to delete', async () => {
      Catch.destroy.mockResolvedValueOnce(0)
      const h = getMockResponseToolkit()

      const result = await deleteCatchHandler(getDeleteRequest('0'), h)

      expect(handleNotFound).toHaveBeenCalledWith(
        'Catch not found for ID: 0',
        h
      )
      expect(result).toBe(NOT_FOUND_SYMBOL)
    })

    it('should call handleServerError if an error occurs while deleting the catch', async () => {
      const error = new Error('Database error')
      Catch.destroy.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      const result = await deleteCatchHandler(getDeleteRequest('2'), h)

      expect(handleServerError).toHaveBeenCalledWith(
        'Error deleting catch',
        error,
        h
      )
      expect(result).toBe(SERVER_ERROR_SYMBOL)
    })

    it('should return an error response if an error occurs while deleting the catch', async () => {
      const error = new Error('Database error')
      Catch.destroy.mockRejectedValueOnce(error)

      const result = await deleteCatchHandler(
        getDeleteRequest('2'),
        getMockResponseToolkit()
      )

      expect(result).toBe(SERVER_ERROR_SYMBOL)
    })
  })

  describe('PATCH /catches/{catchId}', () => {
    const getCatchRequest = (payload) => ({
      ...getServerDetails(),
      params: { catchId: '1' },
      payload
    })

    const getFullCatchPayload = () => ({
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
    })

    const getFoundCatch = () => ({
      update: jest.fn().mockResolvedValue({
        toJSON: jest.fn().mockReturnValue({
          id: '4',
          dateCaught: '2024-08-02T00:00:00.000Z',
          massKg: '2.000000',
          massOz: '70.547924',
          massType: 'METRIC',
          released: false,
          onlyMonthRecorded: true,
          noDateRecorded: false,
          reportingExclude: true,
          createdAt: '2024-11-06T14:45:55.782Z',
          updatedAt: '2025-01-03T09:24:00.032Z',
          version: '2025-01-03T09:24:00.032Z',
          ActivityId: '404',
          activity_id: '404',
          method_id: '1',
          species_id: '1'
        })
      })
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return a 200 status code if the catch is updated successfully', async () => {
      const foundCatch = getFoundCatch()
      Catch.findByPk.mockResolvedValueOnce(foundCatch)

      const result = await patchCatchHandler(
        getCatchRequest(getFullCatchPayload()),
        getMockResponseToolkit()
      )

      expect(result.statusCode).toBe(200)
    })

    it('should return the updated catch if the call to update the catch is successful', async () => {
      const foundCatch = getFoundCatch()
      Catch.findByPk.mockResolvedValueOnce(foundCatch)

      const result = await patchCatchHandler(
        getCatchRequest(getFullCatchPayload()),
        getMockResponseToolkit()
      )

      expect(result.payload).toMatchSnapshot()
    })

    it.each`
      field                  | payload                                              | expectedUpdate
      ${'dateCaught'}        | ${{ dateCaught: '2024-08-02T00:00:00.000Z' }}        | ${{ dateCaught: '2024-08-02' }}
      ${'species'}           | ${{ species: 'species/1' }}                          | ${{ species_id: '1' }}
      ${'mass'}              | ${{ mass: { kg: 9.61, oz: 339, type: 'IMPERIAL' } }} | ${{ massKg: 9.610488, massOz: 339, massType: 'IMPERIAL' }}
      ${'method'}            | ${{ method: 'methods/1' }}                           | ${{ method_id: '1' }}
      ${'released'}          | ${{ released: true }}                                | ${{ released: true }}
      ${'onlyMonthRecorded'} | ${{ onlyMonthRecorded: true }}                       | ${{ onlyMonthRecorded: true }}
      ${'noDateRecorded'}    | ${{ noDateRecorded: true }}                          | ${{ noDateRecorded: true }}
      ${'reportingExclude'}  | ${{ reportingExclude: true }}                        | ${{ reportingExclude: true }}
    `(
      'should call update with "$field"',
      async ({ _field, payload, expectedUpdate }) => {
        const foundCatch = getFoundCatch()
        Catch.findByPk.mockResolvedValueOnce(foundCatch)

        await patchCatchHandler(
          getCatchRequest(payload),
          getMockResponseToolkit()
        )

        expect(foundCatch.update).toHaveBeenCalledWith({
          ...expectedUpdate,
          version: expect.any(Date)
        })
      }
    )

    it('should return a 404 status code if the catch does not exist', async () => {
      Catch.findByPk.mockResolvedValueOnce(null)

      const result = await patchCatchHandler(
        getCatchRequest({
          species: 'species/1'
        }),
        getMockResponseToolkit()
      )

      expect(result).toBe(NOT_FOUND_SYMBOL)
    })

    it('should call handleServerError if an error occurs while updating the catch', async () => {
      const error = new Error('Database error')
      Catch.findByPk.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      await patchCatchHandler(
        getCatchRequest({
          species: 'species/1'
        }),
        h
      )

      expect(handleServerError).toHaveBeenCalledWith(
        'Error updating catch',
        error,
        h
      )
    })

    it('should return an error response if an error occurs while updating the catch', async () => {
      const error = new Error('Database error')
      Catch.findByPk.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      const result = await patchCatchHandler(
        getCatchRequest({
          species: 'species/1'
        }),
        h
      )

      expect(result).toBe(SERVER_ERROR_SYMBOL)
    })
  })
})
