import { SmallCatch, SmallCatchCount } from '../../../entities/index.js'
import {
  getMockResponseToolkit,
  getServerDetails
} from '../../../test-utils/server-test-utils.js'
import {
  handleNotFound,
  handleServerError
} from '../../../utils/server-utils.js'
import routes from '../small-catches.js'
import { sequelize } from '../../../services/database.service.js'

jest.mock('../../../entities/index.js')
jest.mock('../../../utils/logger-utils.js')
jest.mock('../../../utils/server-utils.js')
jest.mock('../../../services/database.service.js', () => ({
  sequelize: {
    transaction: jest.fn(),
    define: jest.fn(() => ({
      associate: jest.fn(),
      bulkCreate: jest.fn(),
      hasMany: jest.fn(),
      belongsTo: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      destroy: jest.fn(),
      associations: jest.fn()
    })),
    literal: jest.fn()
  }
}))

const [
  {
    options: { handler: postSmallCatchHandler }
  },
  {
    options: { handler: getActivityForSmallCatchHandler }
  },
  {
    options: { handler: getSmallCatchHandler }
  },
  {
    options: { handler: deleteSmallCatchHandler }
  },
  {
    options: { handler: patchSmallCatchHandler }
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

  describe('GET /smallCatches/{smallCatchId}', () => {
    const getSmallCatchRequest = (smallCatchId) =>
      getServerDetails({
        params: {
          smallCatchId
        }
      })

    const getSmallCatch = () => ({
      toJSON: jest.fn().mockReturnValue({
        id: '33551',
        month: 1,
        released: 1,
        reportingExclude: false,
        noMonthRecorded: false,
        createdAt: '2024-12-11T10:07:11.726Z',
        updatedAt: '2024-12-11T10:07:11.726Z',
        version: '2024-12-11T10:07:11.729Z',
        ActivityId: '133750',
        activity_id: '133750',
        counts: [
          {
            small_catch_id: '33551',
            method_id: '1',
            count: 2,
            SmallCatchId: '33551'
          },
          {
            small_catch_id: '33551',
            method_id: '3',
            count: 2,
            SmallCatchId: '33551'
          }
        ]
      })
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return a 200 status code and the small catch if it is found', async () => {
      SmallCatch.findOne.mockResolvedValueOnce(getSmallCatch())

      const result = await getSmallCatchHandler(
        getSmallCatchRequest('1'),
        getMockResponseToolkit()
      )

      expect(result.payload).toMatchSnapshot()
      expect(result.statusCode).toBe(200)
    })

    it('should call handleNotFound if the small catch is not found', async () => {
      SmallCatch.findOne.mockResolvedValueOnce(null)
      const h = getMockResponseToolkit()

      await getSmallCatchHandler(getSmallCatchRequest('nonexistent-id'), h)

      expect(handleNotFound).toHaveBeenCalledWith(
        'Small catch not found for ID: nonexistent-id',
        h
      )
    })

    it('should return a not found response if the small catch is not found', async () => {
      SmallCatch.findOne.mockResolvedValueOnce(null)
      const h = getMockResponseToolkit()

      const result = await getSmallCatchHandler(
        getSmallCatchRequest('nonexistent-id'),
        h
      )

      expect(result).toBe(NOT_FOUND_SYMBOL)
    })

    it('should call handleServerError if an error occurs while fetching the small catch', async () => {
      const error = new Error('Database error')
      SmallCatch.findOne.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      await getSmallCatchHandler(getSmallCatchRequest('1'), h)

      expect(handleServerError).toHaveBeenCalledWith(
        'Error fetching small catch by ID',
        error,
        h
      )
    })

    it('should return an error response if an error occurs while fetching the the small catch', async () => {
      const error = new Error('Database error')
      SmallCatch.findOne.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      const result = await getSmallCatchHandler(getSmallCatchRequest('1'), h)

      expect(result).toBe(SERVER_ERROR_SYMBOL)
    })
  })

  describe('DELETE /smallCatches/{smallCatchId}', () => {
    const getTransaction = () => ({ commit: jest.fn(), rollback: jest.fn() })

    const getDeleteRequest = (smallCatchId) =>
      getServerDetails({
        params: {
          smallCatchId
        }
      })

    const setUpMocks = ({
      transaction,
      smallCatchCountToDelete = 1,
      smallCatchToDelete = 1
    } = {}) => {
      sequelize.transaction.mockResolvedValueOnce(transaction)
      SmallCatchCount.destroy.mockResolvedValueOnce(smallCatchCountToDelete)
      SmallCatch.destroy.mockResolvedValueOnce(smallCatchToDelete)
    }

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return a 204 status code if the small catch is deleted successfully', async () => {
      setUpMocks({ transaction: getTransaction() })

      const result = await deleteSmallCatchHandler(
        getDeleteRequest('2'),
        getMockResponseToolkit()
      )

      expect(result.statusCode).toBe(204)
    })

    it('should return an empty response body when the small catch is deleted successfully', async () => {
      setUpMocks({ transaction: getTransaction() })

      const result = await deleteSmallCatchHandler(
        getDeleteRequest('2'),
        getMockResponseToolkit()
      )

      expect(result.payload).toBeUndefined()
    })

    it('should delete all SmallCatchCount records', async () => {
      const smallCatchId = '2'
      const transaction = getTransaction()
      setUpMocks({ transaction })

      await deleteSmallCatchHandler(
        getDeleteRequest(smallCatchId),
        getMockResponseToolkit()
      )

      expect(SmallCatchCount.destroy).toHaveBeenCalledWith({
        where: { small_catch_id: smallCatchId },
        transaction
      })
    })

    it('should delete all SmallCatch records', async () => {
      const smallCatchId = '2'
      const transaction = getTransaction()
      setUpMocks({ transaction })

      await deleteSmallCatchHandler(
        getDeleteRequest(smallCatchId),
        getMockResponseToolkit()
      )

      expect(SmallCatch.destroy).toHaveBeenCalledWith({
        where: { id: smallCatchId },
        transaction
      })
    })

    it('should commit the transaction on successful deletion', async () => {
      const transaction = getTransaction()
      setUpMocks({ transaction })

      await deleteSmallCatchHandler(
        getDeleteRequest('1'),
        getMockResponseToolkit()
      )

      expect(transaction.commit).toHaveBeenCalled()
    })

    it('should call handleNotFound if no small catch is found to delete', async () => {
      setUpMocks({
        transaction: getTransaction(),
        smallCatchCountToDelete: 1,
        smallCatchToDelete: 0
      })
      const h = getMockResponseToolkit()

      const result = await deleteSmallCatchHandler(getDeleteRequest('0'), h)

      expect(handleNotFound).toHaveBeenCalledWith(
        'Small catch not found for ID: 0',
        h
      )
      expect(result).toBe(NOT_FOUND_SYMBOL)
    })

    it('should rollback the transaction if no small catch is found to delete', async () => {
      const transaction = getTransaction()
      setUpMocks({
        transaction,
        smallCatchCountToDelete: 1,
        smallCatchToDelete: 0
      })
      const h = getMockResponseToolkit()

      await deleteSmallCatchHandler(getDeleteRequest('0'), h)

      expect(transaction.rollback).toHaveBeenCalled()
    })

    it('should call handleServerError if an error occurs while deleting the small catch', async () => {
      sequelize.transaction.mockResolvedValueOnce(getTransaction())
      SmallCatchCount.destroy.mockResolvedValueOnce(0)
      const error = new Error('Database error')
      SmallCatch.destroy.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      const result = await deleteSmallCatchHandler(getDeleteRequest('2'), h)

      expect(handleServerError).toHaveBeenCalledWith(
        'Error deleting small catch',
        error,
        h
      )
      expect(result).toBe(SERVER_ERROR_SYMBOL)
    })

    it('should call handleServerError if an error occurs while deleting the small catch count', async () => {
      sequelize.transaction.mockResolvedValueOnce(getTransaction())
      const error = new Error('Database error')
      SmallCatchCount.destroy.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      const result = await deleteSmallCatchHandler(getDeleteRequest('2'), h)

      expect(handleServerError).toHaveBeenCalledWith(
        'Error deleting small catch',
        error,
        h
      )
      expect(result).toBe(SERVER_ERROR_SYMBOL)
    })

    it('should return an error response if an error occurs while deleting the small catch', async () => {
      sequelize.transaction.mockResolvedValueOnce(getTransaction())
      const error = new Error('Database error')
      SmallCatchCount.destroy.mockResolvedValueOnce(0)
      SmallCatch.destroy.mockRejectedValueOnce(error)

      const result = await deleteSmallCatchHandler(
        getDeleteRequest('2'),
        getMockResponseToolkit()
      )

      expect(result).toBe(SERVER_ERROR_SYMBOL)
    })
  })

  describe('PATCH /smallCatches/{smallCatchId}', () => {
    const getTransaction = () => ({ commit: jest.fn(), rollback: jest.fn() })

    const getSmallCatchRequest = (payload) => ({
      ...getServerDetails(),
      params: { smallCatchId: '1' },
      payload
    })

    const setUpMocks = ({
      transaction,
      foundSmallCatch,
      countsToDestroy = 1
    } = {}) => {
      sequelize.transaction.mockResolvedValueOnce(transaction)
      SmallCatch.findOne.mockResolvedValueOnce(foundSmallCatch)
      SmallCatchCount.destroy.mockResolvedValueOnce(countsToDestroy)
      SmallCatchCount.bulkCreate.mockResolvedValueOnce(0)
    }

    afterEach(() => {
      jest.clearAllMocks()
    })

    const getFullSmallCatchPayload = () => ({
      month: 'DECEMBER',
      released: '2',
      counts: [
        {
          method: 'methods/1',
          count: '2'
        },
        {
          method: 'methods/2',
          count: '2'
        }
      ],
      noMonthRecorded: true
    })

    const getFoundSmallCatch = () => ({
      update: jest.fn().mockResolvedValueOnce({
        toJSON: jest.fn().mockReturnValueOnce({
          id: '33551',
          month: 12,
          released: 2,
          reportingExclude: false,
          noMonthRecorded: true,
          createdAt: '2024-12-11T10:07:11.726Z',
          updatedAt: '2025-01-22T10:55:20.512Z',
          version: '2025-01-22T10:55:20.511Z',
          ActivityId: '133750',
          activity_id: '133750',
          counts: [
            {
              small_catch_id: '33551',
              method_id: '1',
              count: 2,
              SmallCatchId: '33551'
            },
            {
              small_catch_id: '33551',
              method_id: '2',
              count: 2,
              SmallCatchId: '33551'
            }
          ]
        })
      })
    })

    it('should return a 200 status code if the small catch is updated successfully', async () => {
      const transaction = getTransaction()
      const foundSmallCatch = getFoundSmallCatch()
      setUpMocks({ transaction, foundSmallCatch })

      const result = await patchSmallCatchHandler(
        getSmallCatchRequest(getFullSmallCatchPayload()),
        getMockResponseToolkit()
      )

      expect(result.statusCode).toBe(200)
    })

    it('should return the updated small catch in the response', async () => {
      const transaction = getTransaction()
      const foundSmallCatch = getFoundSmallCatch()
      setUpMocks({ transaction, foundSmallCatch })

      const result = await patchSmallCatchHandler(
        getSmallCatchRequest(getFullSmallCatchPayload()),
        getMockResponseToolkit()
      )

      expect(result.payload).toMatchSnapshot()
    })

    it('should delete existing counts if new counts are provided', async () => {
      const transaction = getTransaction()
      const foundSmallCatch = getFoundSmallCatch()
      setUpMocks({ transaction, foundSmallCatch })

      await patchSmallCatchHandler(
        getSmallCatchRequest(getFullSmallCatchPayload()),
        getMockResponseToolkit()
      )

      expect(SmallCatchCount.destroy).toHaveBeenCalledWith({
        where: { small_catch_id: '1' },
        transaction
      })
    })

    it('should create new small catch counts if new counts are provided', async () => {
      const transaction = getTransaction()
      const foundSmallCatch = getFoundSmallCatch()
      setUpMocks({ transaction, foundSmallCatch })

      await patchSmallCatchHandler(
        getSmallCatchRequest(getFullSmallCatchPayload()),
        getMockResponseToolkit()
      )

      expect(SmallCatchCount.bulkCreate).toHaveBeenCalledWith(
        [
          { count: '2', method_id: '1', small_catch_id: '1' },
          { count: '2', method_id: '2', small_catch_id: '1' }
        ],
        { transaction }
      )
    })

    it('should call handleNotFound if the small catch does not exist', async () => {
      const transaction = getTransaction()
      sequelize.transaction.mockResolvedValueOnce(transaction)
      SmallCatch.findOne.mockResolvedValueOnce(undefined)

      const result = await patchSmallCatchHandler(
        getSmallCatchRequest(getFullSmallCatchPayload()),
        getMockResponseToolkit()
      )

      expect(result).toBe(NOT_FOUND_SYMBOL)
    })

    it('should rollback the transaction if deleting small catch count fails', async () => {
      const error = new Error('yesDatabase error')
      const transaction = getTransaction()
      const foundSmallCatch = getFoundSmallCatch()
      sequelize.transaction.mockResolvedValueOnce(transaction)
      SmallCatch.findOne.mockResolvedValueOnce(foundSmallCatch)
      SmallCatchCount.destroy.mockRejectedValueOnce(error)

      await patchSmallCatchHandler(
        getSmallCatchRequest(getFullSmallCatchPayload()),
        getMockResponseToolkit()
      )

      expect(transaction.rollback).toHaveBeenCalled()
    })

    it('should call handleServerError if an error occurs while updating the small catch', async () => {
      const error = new Error('Database error')
      const transaction = getTransaction()
      sequelize.transaction.mockResolvedValueOnce(transaction)
      SmallCatch.findOne.mockRejectedValueOnce({
        update: jest.fn().mockRejectedValueOnce(error)
      })

      const result = await patchSmallCatchHandler(
        getSmallCatchRequest(getFullSmallCatchPayload()),
        getMockResponseToolkit()
      )

      expect(result).toBe(SERVER_ERROR_SYMBOL)
    })

    it('should rollback the transaction if an error occurs while updating the small catch', async () => {
      const error = new Error('Database error')
      const transaction = getTransaction()
      sequelize.transaction.mockResolvedValueOnce(transaction)
      SmallCatch.findOne.mockRejectedValueOnce({
        update: jest.fn().mockRejectedValueOnce(error)
      })

      await patchSmallCatchHandler(
        getSmallCatchRequest(getFullSmallCatchPayload()),
        getMockResponseToolkit()
      )

      expect(transaction.rollback).toHaveBeenCalled()
    })

    it('should rollback the transaction if an error occurs while creating the new small catch counts', async () => {
      const error = new Error('Database error')
      const transaction = getTransaction()
      sequelize.transaction.mockResolvedValueOnce(transaction)
      SmallCatch.findOne.mockResolvedValueOnce(getFoundSmallCatch())
      SmallCatchCount.destroy.mockResolvedValueOnce(0)
      SmallCatchCount.bulkCreate.mockRejectedValueOnce(error)

      await patchSmallCatchHandler(
        getSmallCatchRequest(getFullSmallCatchPayload()),
        getMockResponseToolkit()
      )

      expect(transaction.rollback).toHaveBeenCalled()
    })
  })

  // TODO add table test
})
