import {
  Activity,
  Catch,
  SmallCatch,
  SmallCatchCount
} from '../../../entities/index.js'
import {
  getMockResponseToolkit,
  getServerDetails
} from '../../../test-utils/server-test-utils.js'
import {
  handleNotFound,
  handleServerError
} from '../../../utils/server-utils.js'
import routes from '../activities.js'
import { sequelize } from '../../../services/database.service.js'

jest.mock('../../../entities/index.js')
jest.mock('../../../utils/logger-utils.js')
jest.mock('../../../utils/server-utils.js')
jest.mock('../../../services/database.service.js', () => ({
  sequelize: {
    transaction: jest.fn(),
    define: jest.fn(() => ({
      associate: jest.fn(),
      hasMany: jest.fn(),
      belongsTo: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      destroy: jest.fn()
    })),
    literal: jest.fn()
  }
}))

const [
  {
    options: { handler: postActivityHandler }
  },
  {
    options: { handler: getRiverForActivityHandler }
  },
  {
    options: { handler: getSmallCatchesForActivityHandler }
  },
  {
    options: { handler: getCatchesForActivityHandler }
  },
  {
    options: { handler: getActivityHandler }
  },
  {
    options: { handler: deleteActivityHandler }
  }
] = routes

const NOT_FOUND_SYMBOL = Symbol('NOT_FOUND')
const SERVER_ERROR_SYMBOL = Symbol('SERVER_ERROR')

handleNotFound.mockReturnValue(NOT_FOUND_SYMBOL)
handleServerError.mockReturnValue(SERVER_ERROR_SYMBOL)

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

      const result = await postActivityHandler(
        getActivityRequest(),
        getMockResponseToolkit()
      )

      expect(result.statusCode).toBe(201)
    })

    it('should return the created activity if the call to create the activity is successful', async () => {
      Activity.create.mockResolvedValueOnce(getCreatedActivity())

      const result = await postActivityHandler(
        getActivityRequest(),
        getMockResponseToolkit()
      )

      expect(result.payload).toMatchSnapshot()
    })

    it('should call handleServerError if an error occurs while creating the activity', async () => {
      const error = new Error('Database error')
      Activity.create.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      await postActivityHandler(getActivityRequest(), h)

      expect(handleServerError).toHaveBeenCalledWith(
        'Error creating activity',
        error,
        h
      )
    })

    it('should return an error response if an error occurs while creating the activity', async () => {
      const error = new Error('Database error')
      Activity.create.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      const result = await postActivityHandler(getActivityRequest(), h)

      expect(result).toBe(SERVER_ERROR_SYMBOL)
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

      const result = await getRiverForActivityHandler(
        getActivityRequest('1'),
        getMockResponseToolkit()
      )

      expect(result.payload).toStrictEqual({
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
      expect(result.statusCode).toBe(200)
    })

    it('should call handleNotFound if the activity is not found', async () => {
      Activity.findOne.mockResolvedValueOnce(null)
      const h = getMockResponseToolkit()

      await getRiverForActivityHandler(getActivityRequest('nonexistent-id'), h)

      expect(handleNotFound).toHaveBeenCalledWith(
        'Activity not found or has no associated river',
        h
      )
    })

    it('should return a not found response if the activity is not found', async () => {
      Activity.findOne.mockResolvedValueOnce(null)
      const h = getMockResponseToolkit()

      const result = await getRiverForActivityHandler(
        getActivityRequest('nonexistent-id'),
        h
      )

      expect(result).toBe(NOT_FOUND_SYMBOL)
    })

    it('should call handleServerError if an error occurs while fetching the river for the activity', async () => {
      const error = new Error('Database error')
      Activity.findOne.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      await getRiverForActivityHandler(getActivityRequest('1'), h)

      expect(handleServerError).toHaveBeenCalledWith(
        'Error fetching river for activity',
        error,
        h
      )
    })

    it('should return an error response if an error occurs while fetching the river for the activity', async () => {
      const error = new Error('Database error')
      Activity.findOne.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      const result = await getRiverForActivityHandler(
        getActivityRequest('1'),
        h
      )

      expect(result).toBe(SERVER_ERROR_SYMBOL)
    })
  })

  describe('GET /activities/{activityId}/smallCatches', () => {
    const getActivityRequest = (activityId) => ({
      ...getServerDetails(),
      params: {
        activityId
      }
    })

    const getActivityWithSmallCatches = () => ({
      SmallCatches: [
        {
          id: '53',
          month: 4,
          released: 3,
          reportingExclude: false,
          noMonthRecorded: false,
          createdAt: '2024-10-11T09:30:57.463Z',
          updatedAt: '2024-10-11T09:30:57.463Z',
          version: '2024-10-11T09:30:57.463Z',
          ActivityId: '3',
          activity_id: '3',
          counts: [
            {
              small_catch_id: '53',
              method_id: '1',
              count: 3,
              SmallCatchId: '53'
            },
            {
              small_catch_id: '53',
              method_id: '2',
              count: 2,
              SmallCatchId: '53'
            },
            {
              small_catch_id: '53',
              method_id: '3',
              count: 1,
              SmallCatchId: '53'
            }
          ]
        },
        {
          id: '700',
          month: 6,
          released: 3,
          reportingExclude: false,
          noMonthRecorded: false,
          createdAt: '2024-10-30T14:14:16.698Z',
          updatedAt: '2024-10-30T14:14:16.698Z',
          version: '2024-10-30T14:14:16.697Z',
          ActivityId: '3',
          activity_id: '3',
          counts: [
            {
              small_catch_id: '700',
              method_id: '1',
              count: 1,
              SmallCatchId: '700'
            },
            {
              small_catch_id: '700',
              method_id: '2',
              count: 2,
              SmallCatchId: '700'
            },
            {
              small_catch_id: '700',
              method_id: '3',
              count: 1,
              SmallCatchId: '700'
            }
          ]
        }
      ]
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return a 200 status code and the small catches if the activity is found', async () => {
      Activity.findOne.mockResolvedValueOnce(getActivityWithSmallCatches())

      const result = await getSmallCatchesForActivityHandler(
        getActivityRequest('1'),
        getMockResponseToolkit()
      )

      expect(result.payload).toMatchSnapshot()
      expect(result.statusCode).toBe(200)
    })

    it('should call handleNotFound if the activity is not found', async () => {
      Activity.findOne.mockResolvedValueOnce(null)
      const h = getMockResponseToolkit()

      await getSmallCatchesForActivityHandler(
        getActivityRequest('nonexistent-id'),
        h
      )

      expect(handleNotFound).toHaveBeenCalledWith(
        'Small catches not found for nonexistent-id',
        h
      )
    })

    it('should return a not found response if the activity is not found', async () => {
      Activity.findOne.mockResolvedValueOnce(null)
      const h = getMockResponseToolkit()

      const result = await getSmallCatchesForActivityHandler(
        getActivityRequest('nonexistent-id'),
        h
      )

      expect(result).toBe(NOT_FOUND_SYMBOL)
    })

    it('should return a 200 status code and an empty array if the activity exists, but no small catches have been added to it', async () => {
      Activity.findOne.mockResolvedValueOnce({
        SmallCatches: []
      })

      const result = await getSmallCatchesForActivityHandler(
        getActivityRequest('1'),
        getMockResponseToolkit()
      )

      expect(result.payload).toStrictEqual({
        _embedded: {
          smallCatches: []
        }
      })
      expect(result.statusCode).toBe(200)
    })

    it('should return a 200 status code and an empty array if the activity exists, but small catches is undefined', async () => {
      Activity.findOne.mockResolvedValueOnce({
        SmallCatches: undefined
      })

      const result = await getSmallCatchesForActivityHandler(
        getActivityRequest('1'),
        getMockResponseToolkit()
      )

      expect(result.payload).toStrictEqual({
        _embedded: {
          smallCatches: []
        }
      })
      expect(result.statusCode).toBe(200)
    })

    it('should call handleServerError if an error occurs while fetching the small catches for the activity', async () => {
      const error = new Error('Database error')
      Activity.findOne.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      await getSmallCatchesForActivityHandler(getActivityRequest('1'), h)

      expect(handleServerError).toHaveBeenCalledWith(
        'Error fetching small catches',
        error,
        h
      )
    })

    it('should an error response if an error occurs while fetching the small catches for the activity', async () => {
      const error = new Error('Database error')
      Activity.findOne.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      const result = await getSmallCatchesForActivityHandler(
        getActivityRequest('1'),
        h
      )

      expect(result).toBe(SERVER_ERROR_SYMBOL)
    })
  })

  describe('GET /activities/{activityId}/catches', () => {
    const getActivityRequest = (activityId) => ({
      ...getServerDetails(),
      params: {
        activityId
      }
    })

    const getActivityWithCatches = () => ({
      Catches: [
        {
          id: '550',
          dateCaught: '2024-06-23',
          massKg: '9.610488',
          massOz: '339.000000',
          massType: 'IMPERIAL',
          released: true,
          onlyMonthRecorded: false,
          noDateRecorded: false,
          reportingExclude: true,
          createdAt: '2024-11-15T10:32:02.650Z',
          updatedAt: '2024-11-15T10:32:02.650Z',
          version: '2024-11-15T10:32:02.647Z',
          ActivityId: '1',
          activity_id: '1',
          method_id: '1',
          species_id: '1'
        },
        {
          id: '1600',
          dateCaught: '2024-06-24',
          massKg: '9.610488',
          massOz: '339.000000',
          massType: 'IMPERIAL',
          released: true,
          onlyMonthRecorded: false,
          noDateRecorded: false,
          reportingExclude: false,
          createdAt: '2024-11-18T11:22:36.438Z',
          updatedAt: '2024-11-18T11:22:36.438Z',
          version: '2024-11-18T11:22:36.437Z',
          ActivityId: '1',
          activity_id: '1',
          method_id: '1',
          species_id: '1'
        }
      ]
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return a 200 status code and the catches if the activity is found', async () => {
      Activity.findOne.mockResolvedValueOnce(getActivityWithCatches())

      const result = await getCatchesForActivityHandler(
        getActivityRequest('1'),
        getMockResponseToolkit()
      )

      expect(result.payload).toMatchSnapshot()
      expect(result.statusCode).toBe(200)
    })

    it('should call handleNotFound if the activity is not found', async () => {
      Activity.findOne.mockResolvedValueOnce(null)
      const h = getMockResponseToolkit()

      await getCatchesForActivityHandler(
        getActivityRequest('nonexistent-id'),
        h
      )

      expect(handleNotFound).toHaveBeenCalledWith(
        'Catches not found for nonexistent-id',
        h
      )
    })

    it('should return a not found response if the activity is not found', async () => {
      Activity.findOne.mockResolvedValueOnce(null)
      const h = getMockResponseToolkit()

      const result = await getCatchesForActivityHandler(
        getActivityRequest('nonexistent-id'),
        h
      )

      expect(result).toBe(NOT_FOUND_SYMBOL)
    })

    it('should return a 200 status code and an empty array if the activity exists, but no catches have been added to it', async () => {
      Activity.findOne.mockResolvedValueOnce({
        Catches: []
      })

      const result = await getCatchesForActivityHandler(
        getActivityRequest('1'),
        getMockResponseToolkit()
      )

      expect(result.payload).toStrictEqual({
        _embedded: {
          catches: []
        }
      })
      expect(result.statusCode).toBe(200)
    })

    it('should return a 200 status code and an empty array if the activity exists, but catches is undefined', async () => {
      Activity.findOne.mockResolvedValueOnce({
        Catches: undefined
      })

      const result = await getCatchesForActivityHandler(
        getActivityRequest('1'),
        getMockResponseToolkit()
      )

      expect(result.payload).toStrictEqual({
        _embedded: {
          catches: []
        }
      })
      expect(result.statusCode).toBe(200)
    })

    it('should call handleServerError if an error occurs while fetching the catches for the activity', async () => {
      const error = new Error('Database error')
      Activity.findOne.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      await getCatchesForActivityHandler(getActivityRequest('1'), h)

      expect(handleServerError).toHaveBeenCalledWith(
        'Error fetching catches',
        error,
        h
      )
    })

    it('should return an error if an error occurs while fetching the catches for the activity', async () => {
      const error = new Error('Database error')
      Activity.findOne.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      const result = await getCatchesForActivityHandler(
        getActivityRequest('1'),
        h
      )

      expect(result).toBe(SERVER_ERROR_SYMBOL)
    })
  })

  describe('GET /activities/{activityId}', () => {
    const getActivityRequest = (activityId) => ({
      ...getServerDetails(),
      params: {
        activityId
      }
    })

    const getActivity = () => ({
      toJSON: jest.fn().mockReturnValue({
        id: '400',
        daysFishedWithMandatoryRelease: 2,
        daysFishedOther: 0,
        createdAt: '2024-10-18T07:52:06.331Z',
        updatedAt: '2024-11-06T14:31:59.922Z',
        version: '2024-11-06T14:31:59.922Z',
        submission_id: '2802',
        river_id: '1',
        SubmissionId: '2802'
      })
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return a 200 status code and the activity if it is found', async () => {
      Activity.findOne.mockResolvedValueOnce(getActivity())

      const result = await getActivityHandler(
        getActivityRequest('1'),
        getMockResponseToolkit()
      )

      expect(result.payload).toMatchSnapshot()
      expect(result.statusCode).toBe(200)
    })

    it('should call handleNotFound if the activity is not found', async () => {
      Activity.findOne.mockResolvedValueOnce(null)
      const h = getMockResponseToolkit()

      await getActivityHandler(getActivityRequest('nonexistent-id'), h)

      expect(handleNotFound).toHaveBeenCalledWith(
        'Activity not found for ID: nonexistent-id',
        h
      )
    })

    it('should return a not found response if the activity is not found', async () => {
      Activity.findOne.mockResolvedValueOnce(null)
      const h = getMockResponseToolkit()

      const result = await getActivityHandler(
        getActivityRequest('nonexistent-id'),
        h
      )

      expect(result).toBe(NOT_FOUND_SYMBOL)
    })

    it('should call handleServerError if an error occurs while fetching the activity', async () => {
      const error = new Error('Database error')
      Activity.findOne.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      await getActivityHandler(getActivityRequest('1'), h)

      expect(handleServerError).toHaveBeenCalledWith(
        'Error fetching activity by ID',
        error,
        h
      )
    })

    it('should return an error response if an error occurs while fetching the the activity', async () => {
      const error = new Error('Database error')
      Activity.findOne.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      const result = await getActivityHandler(getActivityRequest('1'), h)

      expect(result).toBe(SERVER_ERROR_SYMBOL)
    })
  })

  describe('DELETE /activities/{activityId}', () => {
    const getDeleteRequest = (activityId) =>
      getServerDetails({ params: { activityId } })

    const getTransaction = () => ({ commit: jest.fn(), rollback: jest.fn() })

    const setUpDeleteSuccess = ({
      smallCatchIds = [1, 2, 3],
      transaction
    } = {}) => {
      sequelize.transaction.mockResolvedValueOnce(transaction)
      SmallCatch.findAll.mockResolvedValueOnce(
        smallCatchIds.map((id) => ({ id, toJSON: jest.fn() }))
      )
      SmallCatchCount.destroy.mockResolvedValueOnce(3)
      SmallCatch.destroy.mockResolvedValueOnce(3)
      Catch.destroy.mockResolvedValueOnce(2)
      Activity.destroy.mockResolvedValueOnce(1)
    }

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should call Activity.destroy with the correct parameters', async () => {
      const activityId = '3'
      const transaction = getTransaction()
      setUpDeleteSuccess({ transaction })

      await deleteActivityHandler(
        getDeleteRequest(activityId),
        getMockResponseToolkit()
      )

      expect(Activity.destroy).toHaveBeenCalledWith({
        where: { id: activityId },
        transaction
      })
    })

    it('should call SmallCatch.findAll to fetch associated small catches', async () => {
      const activityId = '3'
      const transaction = getTransaction()
      setUpDeleteSuccess({ transaction })

      await deleteActivityHandler(
        getDeleteRequest(activityId),
        getMockResponseToolkit()
      )

      expect(SmallCatch.findAll).toHaveBeenCalledWith({
        attributes: ['id'],
        where: { activity_id: activityId },
        transaction
      })
    })

    it('should delete all associated SmallCatchCount records', async () => {
      const smallCatchIds = [1, 2, 3, 4]
      const transaction = getTransaction()
      setUpDeleteSuccess({ smallCatchIds, transaction })

      await deleteActivityHandler(
        getDeleteRequest('2'),
        getMockResponseToolkit()
      )

      expect(SmallCatchCount.destroy).toHaveBeenCalledWith({
        where: { small_catch_id: smallCatchIds },
        transaction
      })
    })

    it('should delete all associated SmallCatch records', async () => {
      const activityId = '3'
      const transaction = getTransaction()
      setUpDeleteSuccess({ transaction })

      await deleteActivityHandler(
        getDeleteRequest(activityId),
        getMockResponseToolkit()
      )

      expect(SmallCatch.destroy).toHaveBeenCalledWith({
        where: { activity_id: activityId },
        transaction
      })
    })

    it('should delete all associated Catch records', async () => {
      const activityId = '3'
      const transaction = getTransaction()
      setUpDeleteSuccess({ transaction })

      await deleteActivityHandler(
        getDeleteRequest(activityId),
        getMockResponseToolkit()
      )

      expect(Catch.destroy).toHaveBeenCalledWith({
        where: { activity_id: activityId },
        transaction
      })
    })

    it('should commit the transaction on successful deletion', async () => {
      const activityId = '3'
      const transaction = getTransaction()
      setUpDeleteSuccess({ transaction })

      await deleteActivityHandler(
        getDeleteRequest(activityId),
        getMockResponseToolkit()
      )

      expect(transaction.commit).toHaveBeenCalled()
    })

    it('should return a 204 status code on successful deletion', async () => {
      const transaction = getTransaction()
      setUpDeleteSuccess({ transaction })

      const result = await deleteActivityHandler(
        getDeleteRequest('3'),
        getMockResponseToolkit()
      )

      expect(result.statusCode).toBe(204)
    })

    it('should return an empty response body on successful deletion', async () => {
      const transaction = getTransaction()
      setUpDeleteSuccess({ transaction })

      const result = await deleteActivityHandler(
        getDeleteRequest('3'),
        getMockResponseToolkit()
      )

      expect(result.payload).toBeUndefined()
    })

    it('should call handleNotFound if the activity does not exist', async () => {
      const activityId = 'nonexistent-id'
      const transaction = getTransaction()
      sequelize.transaction.mockResolvedValueOnce(transaction)
      Activity.destroy.mockResolvedValueOnce(0)
      const h = getMockResponseToolkit()

      await deleteActivityHandler(getDeleteRequest(activityId), h)

      expect(handleNotFound).toHaveBeenCalledWith(
        `Activity with ID ${activityId} not found`,
        h
      )
    })

    it('should rollback the transaction if the activity does not exist', async () => {
      const transaction = getTransaction()
      sequelize.transaction.mockResolvedValueOnce(transaction)
      Activity.destroy.mockResolvedValueOnce(0)
      const h = getMockResponseToolkit()

      await deleteActivityHandler(getDeleteRequest('nonexistent-id'), h)

      expect(transaction.rollback).toHaveBeenCalled()
    })

    it('should call handleServerError if an error occurs during Activity.destroy', async () => {
      const error = new Error('Database error')
      sequelize.transaction.mockResolvedValueOnce(getTransaction())
      Activity.destroy.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      await deleteActivityHandler(getDeleteRequest('3'), h)

      expect(handleServerError).toHaveBeenCalledWith(
        'Error deleting activity',
        error,
        h
      )
    })

    it('should rollback the transaction if an error occurs during deletion', async () => {
      const error = new Error('Database error')
      const transaction = getTransaction()
      sequelize.transaction.mockResolvedValueOnce(transaction)
      Activity.destroy.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      await deleteActivityHandler(getDeleteRequest('3'), h)

      expect(transaction.rollback).toHaveBeenCalled()
    })

    it('should return SERVER_ERROR_SYMBOL if an error occurs during deletion', async () => {
      const error = new Error('Database error')
      sequelize.transaction.mockResolvedValueOnce(getTransaction())
      Activity.destroy.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      const result = await deleteActivityHandler(getDeleteRequest('3'), h)

      expect(result).toBe(SERVER_ERROR_SYMBOL)
    })
  })
})
