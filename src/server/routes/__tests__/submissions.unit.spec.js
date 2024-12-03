import {
  getMockResponseToolkit,
  getServerDetails
} from '../../../test-utils/server-test-utils.js'
import { Submission } from '../../../entities/index.js'
import { createActivity as createActivityCRM } from '@defra-fish/dynamics-lib'
import { getCreateActivityResponse } from '../../../test-utils/test-data.js'
import logger from '../../../utils/logger-utils.js'
import routes from '../submissions.js'

jest.mock('../../../entities/index.js')
jest.mock('../../../utils/logger-utils.js')

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
  }
] = routes

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
    const getSubmissionRequest = () => ({
      ...getServerDetails(),
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

    it('should log an error if submission creation fails', async () => {
      const error = new Error('Database error')
      Submission.create.mockRejectedValueOnce(error)

      await postSubmissionHandler(
        getSubmissionRequest(),
        getMockResponseToolkit()
      )

      expect(logger.error).toHaveBeenCalledWith(
        'Error creating submission:',
        error
      )
    })

    it('should return 500 and an error if an error occurs while creating submission', async () => {
      const error = new Error('Database error')
      Submission.create.mockRejectedValueOnce(error)

      const result = await postSubmissionHandler(
        getSubmissionRequest(),
        getMockResponseToolkit()
      )

      expect(result.payload).toStrictEqual({
        error: 'Unable create submission'
      })
      expect(result.statusCode).toBe(500)
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

    it('should log an error when the call to create an activity in CRM returns an error', async () => {
      Submission.create.mockResolvedValueOnce(getCreatedSubmission())
      const error = new Error('CRM')
      createActivityCRM.mockRejectedValueOnce(error)

      await postSubmissionHandler(
        getSubmissionRequest(),
        getMockResponseToolkit()
      )

      expect(logger.error).toHaveBeenCalledWith(
        'Error creating submission:',
        error
      )
    })

    it('should return 500 and an error when the call to create an activity in CRM returns an error', async () => {
      Submission.create.mockResolvedValueOnce(getCreatedSubmission())
      const error = new Error('CRM')
      createActivityCRM.mockRejectedValueOnce(error)

      const result = await postSubmissionHandler(
        getSubmissionRequest(),
        getMockResponseToolkit()
      )

      expect(result.payload).toStrictEqual({
        error: 'Unable create submission'
      })
      expect(result.statusCode).toBe(500)
    })
  })

  describe('GET /submissions/search/getByContactIdAndSeason', () => {
    const getSubmissionRequest = () => ({
      ...getServerDetails(),
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

    it('should return 404 if the submission is not found', async () => {
      Submission.findOne.mockResolvedValueOnce(null)

      const result = await getSubmissionByContactIdAndSeasonHandler(
        getSubmissionRequest(),
        getMockResponseToolkit()
      )

      expect(result.statusCode).toBe(404)
    })

    it('should log an error if fetching submission fails', async () => {
      const error = new Error('Database error')
      Submission.findOne.mockRejectedValueOnce(error)

      await getSubmissionByContactIdAndSeasonHandler(
        getSubmissionRequest(),
        getMockResponseToolkit()
      )

      expect(logger.error).toHaveBeenCalledWith(
        'Error finding submission:',
        error
      )
    })

    it('should return 500 and an error if an error occurs while fetching submission', async () => {
      const error = new Error('Database error')
      Submission.findOne.mockRejectedValueOnce(error)

      const result = await getSubmissionByContactIdAndSeasonHandler(
        getSubmissionRequest(),
        getMockResponseToolkit()
      )

      expect(result.payload).toStrictEqual({
        error: 'Unable find submission'
      })
      expect(result.statusCode).toBe(500)
    })
  })

  describe('GET /submissions/{submissionId}', () => {
    const getSubmissionRequest = () => ({
      ...getServerDetails(),
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

    it('should return 404 if the submission is not found', async () => {
      Submission.findOne.mockResolvedValueOnce(null)

      const result = await getSubmissionByIdHandler(
        getSubmissionRequest(),
        getMockResponseToolkit()
      )

      expect(result.statusCode).toBe(404)
    })

    it('should log an error if fetching submission fails', async () => {
      const error = new Error('Database error')
      Submission.findOne.mockRejectedValueOnce(error)

      await getSubmissionByIdHandler(
        getSubmissionRequest(),
        getMockResponseToolkit()
      )

      expect(logger.error).toHaveBeenCalledWith(
        'Error finding submission:',
        error
      )
    })

    it('should return 500 and an error if an error occurs while fetching submission', async () => {
      const error = new Error('Database error')
      Submission.findOne.mockRejectedValueOnce(error)

      const result = await getSubmissionByIdHandler(
        getSubmissionRequest(),
        getMockResponseToolkit()
      )

      expect(result.payload).toStrictEqual({
        error: 'Unable find submission'
      })
      expect(result.statusCode).toBe(500)
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

    const getActivitiesRequest = () => ({
      ...getServerDetails(),
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

    it('should return 404 if the submission does not exist', async () => {
      Submission.findOne.mockResolvedValueOnce(null)

      const result = await getActivitiesBySubmissionIdHandler(
        getActivitiesRequest(),
        getMockResponseToolkit()
      )

      expect(result.statusCode).toBe(404)
    })

    it('should log an error if fetching submission with activities fails', async () => {
      const error = new Error('Database error')
      Submission.findOne.mockRejectedValueOnce(error)

      await getActivitiesBySubmissionIdHandler(
        getActivitiesRequest(),
        getMockResponseToolkit()
      )

      expect(logger.error).toHaveBeenCalledWith(
        'Error activities for submission:',
        error
      )
    })

    it('should return 500 and an error if an error occurs while fetching submission with activities', async () => {
      const error = new Error('Database error')
      Submission.findOne.mockRejectedValueOnce(error)

      const result = await getActivitiesBySubmissionIdHandler(
        getActivitiesRequest(),
        getMockResponseToolkit()
      )

      expect(result.payload).toStrictEqual({
        error: 'Unable to find activities for submission'
      })
      expect(result.statusCode).toBe(500)
    })
  })
})
