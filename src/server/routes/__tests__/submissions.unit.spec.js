import {
  getMockResponseToolkit,
  getServerDetails
} from '../../../test-utils/server-test-utils.js'
import {
  handleNotFound,
  handleServerError
} from '../../../utils/server-utils.js'
import { Submission } from '../../../entities/index.js'
import { createActivity as createActivityCRM } from '@defra-fish/dynamics-lib'
import { getCreateActivityResponse } from '../../../test-utils/test-data.js'
import logger from '../../../utils/logger-utils.js'
import routes from '../submissions.js'

jest.mock('../../../entities/index.js')
jest.mock('../../../utils/logger-utils.js')
jest.mock('../../../utils/server-utils.js')

const [
  {
    options: { handler: postSubmissionHandler }
  },
  {
    options: { handler: getSubmissionByContactIdAndSeasonHandler }
  },
  {
    options: { handler: getActivitiesBySubmissionIdHandler }
  },
  {
    options: { handler: getSubmissionByIdHandler }
  },
  {
    options: { handler: patchSubmissionByIdHandler }
  }
] = routes

const NOT_FOUND_SYMBOL = Symbol('NOT_FOUND')
const SERVER_ERROR_SYMBOL = Symbol('SERVER_ERROR')

handleNotFound.mockReturnValue(NOT_FOUND_SYMBOL)
handleServerError.mockReturnValue(SERVER_ERROR_SYMBOL)

describe('submissions.unit', () => {
  const getFoundSubmission = () => ({
    toJSON: jest.fn().mockReturnValue({
      id: '1',
      contactId: 'contact-identifier-111',
      season: '2024',
      status: 'COMPLETE',
      source: 'WEB',
      version: '2024-10-10T13:13:11.000Z',
      reportingExclude: false,
      createdAt: '2024-10-10T13:13:11.000Z',
      updatedAt: '2024-10-10T13:13:11.000Z'
    })
  })

  describe('POST /submissions', () => {
    const getSubmissionRequest = () =>
      getServerDetails({
        payload: {
          contactId: 'contact-identifier-111',
          season: '2024',
          status: 'INCOMPLETE',
          source: 'WEB'
        }
      })

    const getCreatedSubmission = () => ({
      toJSON: jest.fn().mockReturnValue({
        id: '1',
        contactId: 'contact-identifier-111',
        season: '2024',
        status: 'INCOMPLETE',
        source: 'WEB',
        version: '2024-10-10T13:13:11.000Z',
        reportingExclude: false,
        createdAt: '2024-10-10T13:13:11.000Z',
        updatedAt: '2024-10-10T13:13:11.000Z'
      })
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return a 201 status code if the submission is created successfully', async () => {
      Submission.create.mockResolvedValueOnce(getCreatedSubmission())
      createActivityCRM.mockResolvedValueOnce(getCreateActivityResponse())

      const result = await postSubmissionHandler(
        getSubmissionRequest(),
        getMockResponseToolkit()
      )

      expect(result.statusCode).toBe(201)
    })

    it('should return the created submission in the response body', async () => {
      createActivityCRM.mockResolvedValueOnce(getCreateActivityResponse())
      Submission.create.mockResolvedValueOnce(getCreatedSubmission())

      const result = await postSubmissionHandler(
        getSubmissionRequest(),
        getMockResponseToolkit()
      )

      expect(result.payload).toStrictEqual({
        contactId: 'contact-identifier-111',
        createdAt: '2024-10-10T13:13:11.000Z',
        id: '1',
        reportingExclude: false,
        season: '2024',
        source: 'WEB',
        status: 'INCOMPLETE',
        updatedAt: '2024-10-10T13:13:11.000Z',
        version: '2024-10-10T13:13:11.000Z',
        _links: {
          activities: {
            href: 'http://localhost:3000/api/submissions/1/activities'
          },
          self: {
            href: 'http://localhost:3000/api/submissions/1'
          },
          submission: {
            href: 'http://localhost:3000/api/submissions/1'
          }
        }
      })
    })

    it('should call handleServerError if submission creation fails', async () => {
      const error = new Error('Database error')
      Submission.create.mockRejectedValueOnce(error)

      const h = getMockResponseToolkit()

      await postSubmissionHandler(getSubmissionRequest(), h)

      expect(handleServerError).toHaveBeenCalledWith(
        'Error creating submission',
        error,
        h
      )
    })

    it('should return a error response if an error occurs while creating submission', async () => {
      const error = new Error('Database error')
      Submission.create.mockRejectedValueOnce(error)

      const result = await postSubmissionHandler(
        getSubmissionRequest(),
        getMockResponseToolkit()
      )

      expect(result).toBe(SERVER_ERROR_SYMBOL)
    })

    it('should log an error but still return 201 when the call to create an activity in CRM returns an ErrorMessage', async () => {
      Submission.create.mockResolvedValueOnce(getCreatedSubmission())
      createActivityCRM.mockResolvedValue({
        '@odata.context':
          'https://dynamics.com/api/data/v9.1/defra_CreateRCRActivityResponse',
        RCRActivityId: null,
        ReturnStatus: 'error',
        SuccessMessage: '',
        ErrorMessage: 'Failed to create activity'
      })

      const result = await postSubmissionHandler(
        getSubmissionRequest(),
        getMockResponseToolkit()
      )

      expect(result.statusCode).toBe(201)
      expect(logger.error).toHaveBeenCalledWith(
        'failed to create activity in CRM for contact-identifier-111',
        'Failed to create activity'
      )
    })

    it('should call handleServerError when the call to create an activity in CRM returns an error', async () => {
      Submission.create.mockResolvedValueOnce(getCreatedSubmission())
      const error = new Error('CRM')
      createActivityCRM.mockRejectedValueOnce(error)

      const h = getMockResponseToolkit()
      await postSubmissionHandler(getSubmissionRequest(), h)

      expect(handleServerError).toHaveBeenCalledWith(
        'Error creating submission',
        error,
        h
      )
    })

    it('should return an error response when the call to create an activity in CRM returns an error', async () => {
      Submission.create.mockResolvedValueOnce(getCreatedSubmission())
      const error = new Error('CRM')
      createActivityCRM.mockRejectedValueOnce(error)

      const result = await postSubmissionHandler(
        getSubmissionRequest(),
        getMockResponseToolkit()
      )

      expect(result).toBe(SERVER_ERROR_SYMBOL)
    })
  })

  describe('GET /submissions/search/getByContactIdAndSeason', () => {
    const getSubmissionRequest = () =>
      getServerDetails({
        query: {
          contact_id: 'contact-identifier-111',
          season: '2024'
        }
      })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return a 200 status code if the submission is found', async () => {
      Submission.findOne.mockResolvedValueOnce(getFoundSubmission())

      const result = await getSubmissionByContactIdAndSeasonHandler(
        getSubmissionRequest(),
        getMockResponseToolkit()
      )

      expect(result.statusCode).toBe(200)
    })

    it('should return the found submission in the response body', async () => {
      Submission.findOne.mockResolvedValueOnce(getFoundSubmission())

      const result = await getSubmissionByContactIdAndSeasonHandler(
        getSubmissionRequest(),
        getMockResponseToolkit()
      )

      expect(result.payload).toMatchSnapshot()
    })

    it('should call handleNotFound if the submission is not found', async () => {
      Submission.findOne.mockResolvedValueOnce(null)
      const h = getMockResponseToolkit()

      await getSubmissionByContactIdAndSeasonHandler(getSubmissionRequest(), h)

      expect(handleNotFound).toHaveBeenCalledWith(
        'Submission not found for contact-identifier-111 and 2024',
        h
      )
    })

    it('should return a not found response if the submission is not found', async () => {
      Submission.findOne.mockResolvedValueOnce(null)

      const result = await getSubmissionByContactIdAndSeasonHandler(
        getSubmissionRequest(),
        getMockResponseToolkit()
      )

      expect(result).toBe(NOT_FOUND_SYMBOL)
    })

    it('should call handleServerError if fetching a submission fails', async () => {
      const error = new Error('Database error')
      Submission.findOne.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      await getSubmissionByContactIdAndSeasonHandler(getSubmissionRequest(), h)

      expect(handleServerError).toHaveBeenCalledWith(
        'Error finding submission',
        error,
        h
      )
    })

    it('should return an error message if an error occurs while fetching submission', async () => {
      const error = new Error('Database error')
      Submission.findOne.mockRejectedValueOnce(error)

      const result = await getSubmissionByContactIdAndSeasonHandler(
        getSubmissionRequest(),
        getMockResponseToolkit()
      )

      expect(result).toBe(SERVER_ERROR_SYMBOL)
    })
  })

  describe('GET /submissions/{submissionId}', () => {
    const getSubmissionRequest = () =>
      getServerDetails({
        params: {
          submissionId: '1'
        }
      })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return a 200 status code if the submission is found', async () => {
      Submission.findOne.mockResolvedValueOnce(getFoundSubmission())

      const result = await getSubmissionByIdHandler(
        getSubmissionRequest(),
        getMockResponseToolkit()
      )

      expect(result.statusCode).toBe(200)
    })

    it('should return the found submission in the response body', async () => {
      Submission.findOne.mockResolvedValueOnce(getFoundSubmission())

      const result = await getSubmissionByIdHandler(
        getSubmissionRequest(),
        getMockResponseToolkit()
      )

      expect(result.payload).toStrictEqual({
        contactId: 'contact-identifier-111',
        createdAt: '2024-10-10T13:13:11.000Z',
        id: '1',
        reportingExclude: false,
        season: '2024',
        source: 'WEB',
        status: 'COMPLETE',
        updatedAt: '2024-10-10T13:13:11.000Z',
        version: '2024-10-10T13:13:11.000Z',
        _links: {
          activities: {
            href: 'http://localhost:3000/api/submissions/1/activities'
          },
          self: {
            href: 'http://localhost:3000/api/submissions/1'
          },
          submission: {
            href: 'http://localhost:3000/api/submissions/1'
          }
        }
      })
    })

    it('should call handleNotFound if the submission is not found', async () => {
      Submission.findOne.mockResolvedValueOnce(null)
      const h = getMockResponseToolkit()

      await getSubmissionByIdHandler(getSubmissionRequest(), h)

      expect(handleNotFound).toHaveBeenCalledWith('Submission not found 1', h)
    })

    it('should call a not found response if the submission is not found', async () => {
      Submission.findOne.mockResolvedValueOnce(null)

      const result = await getSubmissionByIdHandler(
        getSubmissionRequest(),
        getMockResponseToolkit()
      )

      expect(result).toBe(NOT_FOUND_SYMBOL)
    })

    it('should call handleServerError if fetching submission fails', async () => {
      const error = new Error('Database error')
      Submission.findOne.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      await getSubmissionByIdHandler(getSubmissionRequest(), h)

      expect(handleServerError).toHaveBeenCalledWith(
        'Error finding submission',
        error,
        h
      )
    })

    it('should return an error response  if an error occurs while fetching submission', async () => {
      const error = new Error('Database error')
      Submission.findOne.mockRejectedValueOnce(error)

      const result = await getSubmissionByIdHandler(
        getSubmissionRequest(),
        getMockResponseToolkit()
      )

      expect(result).toBe(SERVER_ERROR_SYMBOL)
    })
  })

  describe('GET /submissions/{submissionId}/activities', () => {
    const getFoundSubmissionWithActivities = (activities = []) => ({
      id: '1',
      contactId: 'contact-identifier-111',
      season: '2024',
      status: 'COMPLETE',
      source: 'WEB',
      version: '2024-10-10T13:13:11.000Z',
      Activities: activities,
      createdAt: '2024-10-10T13:13:11.000Z',
      updatedAt: '2024-10-10T13:13:11.000Z'
    })

    const getActivityMock = () => ({
      toJSON: jest.fn().mockReturnValue({
        id: '1',
        daysFishedWithMandatoryRelease: 1,
        daysFishedOther: 2,
        createdAt: '2024-10-10T13:13:11.000Z',
        updatedAt: '2024-10-10T13:13:11.000Z',
        version: '2024-10-10T13:13:11.000Z'
      })
    })

    const getActivitiesRequest = () =>
      getServerDetails({
        params: {
          submissionId: '1'
        }
      })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return 200 with activities if they exist for the submission', async () => {
      const foundSubmissionWithActivities = getFoundSubmissionWithActivities([
        getActivityMock()
      ])
      Submission.findOne.mockResolvedValueOnce(foundSubmissionWithActivities)

      const result = await getActivitiesBySubmissionIdHandler(
        getActivitiesRequest(),
        getMockResponseToolkit()
      )

      expect(result.payload).toStrictEqual({
        _embedded: {
          activities: [
            {
              id: '1',
              daysFishedWithMandatoryRelease: 1,
              daysFishedOther: 2,
              createdAt: '2024-10-10T13:13:11.000Z',
              updatedAt: '2024-10-10T13:13:11.000Z',
              version: '2024-10-10T13:13:11.000Z',
              _links: {
                self: {
                  href: 'http://localhost:3000/api/activities/1'
                },
                activity: {
                  href: 'http://localhost:3000/api/activities/1'
                },
                submission: {
                  href: 'http://localhost:3000/api/activities/1/submission'
                },
                catches: {
                  href: 'http://localhost:3000/api/activities/1/catches'
                },
                river: {
                  href: 'http://localhost:3000/api/activities/1/river'
                },
                smallCatches: {
                  href: 'http://localhost:3000/api/activities/1/smallCatches'
                }
              }
            }
          ]
        }
      })
      expect(result.statusCode).toBe(200)
    })

    it('should return 200 with an empty activities array if the submission exists but no activities are found', async () => {
      Submission.findOne.mockResolvedValueOnce(
        getFoundSubmissionWithActivities()
      )

      const result = await getActivitiesBySubmissionIdHandler(
        getActivitiesRequest(),
        getMockResponseToolkit()
      )

      expect(result.payload).toStrictEqual({ _embedded: { activities: [] } })
      expect(result.statusCode).toBe(200)
    })

    it('should call handleNotFound if the submission does not exist', async () => {
      Submission.findOne.mockResolvedValueOnce(null)
      const h = getMockResponseToolkit()

      await getActivitiesBySubmissionIdHandler(getActivitiesRequest(), h)

      expect(handleNotFound).toHaveBeenCalledWith(
        'Activities not found for submission with id 1',
        h
      )
    })

    it('should return a not found response if the submission does not exist', async () => {
      Submission.findOne.mockResolvedValueOnce(null)

      const result = await getActivitiesBySubmissionIdHandler(
        getActivitiesRequest(),
        getMockResponseToolkit()
      )

      expect(result).toBe(NOT_FOUND_SYMBOL)
    })

    it('should log an error if fetching submission with activities fails', async () => {
      const error = new Error('Database error')
      Submission.findOne.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      await getActivitiesBySubmissionIdHandler(getActivitiesRequest(), h)

      expect(handleServerError).toHaveBeenCalledWith(
        'Error finding activities for submission',
        error,
        h
      )
    })

    it('should an error response if an error occurs while fetching submission with activities', async () => {
      const error = new Error('Database error')
      Submission.findOne.mockRejectedValueOnce(error)

      const result = await getActivitiesBySubmissionIdHandler(
        getActivitiesRequest(),
        getMockResponseToolkit()
      )

      expect(result).toBe(SERVER_ERROR_SYMBOL)
    })
  })

  describe('PATCH /submissions/{submissionId}', () => {
    const getSubmissionRequest = (payload) =>
      getServerDetails({
        params: {
          submissionId: '1'
        },
        payload
      })

    const getFoundSubmission = () => ({
      update: jest.fn().mockResolvedValue({
        toJSON: jest.fn().mockReturnValue({
          id: '1',
          contactId: 'contact-identifier-111',
          season: '2024',
          status: 'COMPLETE',
          source: 'WEB',
          version: '2024-10-10T13:13:11.000Z',
          reportingExclude: false,
          createdAt: '2024-10-10T13:13:11.000Z',
          updatedAt: '2024-10-10T13:13:11.000Z'
        })
      })
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return a 200 status code if the submission is updated successfully', async () => {
      Submission.findByPk.mockResolvedValueOnce(getFoundSubmission())

      const result = await patchSubmissionByIdHandler(
        getSubmissionRequest({ status: 'COMPLETE' }),
        getMockResponseToolkit()
      )

      expect(result.statusCode).toBe(200)
    })

    it('should call update with the "status"', async () => {
      const foundSubmission = getFoundSubmission()
      Submission.findByPk.mockResolvedValueOnce(foundSubmission)

      await patchSubmissionByIdHandler(
        getSubmissionRequest({ status: 'COMPLETE' }),
        getMockResponseToolkit()
      )

      expect(foundSubmission.update).toHaveBeenCalledWith({
        status: 'COMPLETE',
        reportingExclude: undefined,
        version: expect.any(Date)
      })
    })

    it('should call update with "reportingExclude"', async () => {
      const foundSubmission = getFoundSubmission()
      Submission.findByPk.mockResolvedValueOnce(foundSubmission)

      await patchSubmissionByIdHandler(
        getSubmissionRequest({ reportingExclude: true }),
        getMockResponseToolkit()
      )

      expect(foundSubmission.update).toHaveBeenCalledWith({
        status: undefined,
        reportingExclude: true,
        version: expect.any(Date)
      })
    })

    it('should return the updated submission in the response body', async () => {
      Submission.findByPk.mockResolvedValueOnce(getFoundSubmission())

      const result = await patchSubmissionByIdHandler(
        getSubmissionRequest({ status: 'COMPLETE' }),
        getMockResponseToolkit()
      )

      expect(result.payload).toMatchSnapshot()
    })

    it('should call handleNotFound if the submission is not found', async () => {
      Submission.findByPk.mockResolvedValueOnce(null)
      const h = getMockResponseToolkit()

      await patchSubmissionByIdHandler(
        getSubmissionRequest({ status: 'COMPLETE' }),
        h
      )

      expect(handleNotFound).toHaveBeenCalledWith(
        'Submission not found for 1',
        h
      )
    })

    it('should return a not found response if the submission is not found', async () => {
      Submission.findByPk.mockResolvedValueOnce(null)

      const result = await patchSubmissionByIdHandler(
        getSubmissionRequest({ status: 'COMPLETE' }),
        getMockResponseToolkit()
      )

      expect(result).toBe(NOT_FOUND_SYMBOL)
    })

    it('should call handleServerError if updating the submission fails', async () => {
      const error = new Error('Database error')
      Submission.findByPk.mockRejectedValueOnce(error)
      const h = getMockResponseToolkit()

      await patchSubmissionByIdHandler(
        getSubmissionRequest({ status: 'COMPLETE' }),
        h
      )

      expect(handleServerError).toHaveBeenCalledWith(
        'Error updating submission',
        error,
        h
      )
    })

    it('should return an error response if an error occurs while updating the submission', async () => {
      const error = new Error('Database error')
      Submission.findByPk.mockRejectedValueOnce(error)

      const result = await patchSubmissionByIdHandler(
        getSubmissionRequest({ status: 'COMPLETE' }),
        getMockResponseToolkit()
      )

      expect(result).toBe(SERVER_ERROR_SYMBOL)
    })
  })
})
