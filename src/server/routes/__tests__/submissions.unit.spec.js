import { Submission } from '../../../entities/index.js'
import logger from '../../../utils/logger-utils.js'
import routes from '../submissions.js'

jest.mock('../../../entities/index.js')
jest.mock('../../../utils/logger-utils.js')

describe('submissions.unit', () => {
  describe('POST /submissions', () => {
    const postSubmissionHandler = routes[0].options.handler

    const getResponseToolkit = () => ({
      response: jest.fn().mockReturnThis(),
      code: jest.fn()
    })

    const getSubmissionRequest = () => ({
      info: {
        host: 'localhost:3000'
      },
      server: {
        info: {
          protocol: 'http'
        }
      },
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
      const request = getSubmissionRequest()
      const createdSubmission = getCreatedSubmission()
      Submission.create.mockResolvedValueOnce(createdSubmission)
      const h = getResponseToolkit()

      await postSubmissionHandler(request, h)

      expect(h.code).toHaveBeenCalledWith(201)
    })

    it('should return the created submission in the response body', async () => {
      const request = getSubmissionRequest()
      const createdSubmission = getCreatedSubmission()
      Submission.create.mockResolvedValueOnce(createdSubmission)
      const h = getResponseToolkit()

      await postSubmissionHandler(request, h)

      expect(h.response).toHaveBeenCalledWith({
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
      const request = getSubmissionRequest()
      const error = new Error('Database error')
      Submission.create.mockRejectedValueOnce(error)
      const h = getResponseToolkit()

      await postSubmissionHandler(request, h)

      expect(logger.error).toHaveBeenCalledWith(
        'Error creating submission:',
        error
      )
    })

    it('should return 500 and an error if an error occurs while creating submission', async () => {
      const request = getSubmissionRequest()
      const error = new Error('Database error')
      Submission.create.mockRejectedValueOnce(error)
      const h = getResponseToolkit()

      await postSubmissionHandler(request, h)

      expect(h.response).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unable create submission'
        })
      )
      expect(h.code).toHaveBeenCalledWith(500)
    })
  })

  describe('GET /submissions/search/getByContactIdAndSeason', () => {
    const getSubmissionHandler = routes[1].options.handler

    const getResponseToolkit = () => ({
      response: jest.fn().mockReturnThis(),
      code: jest.fn()
    })

    const getSubmissionRequest = () => ({
      info: {
        host: 'localhost:3000'
      },
      server: {
        info: {
          protocol: 'http'
        }
      },
      query: {
        contact_id: 'contact-identifier-111',
        season: '2024'
      }
    })

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

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return a 200 status code if the submission is found', async () => {
      const request = getSubmissionRequest()
      const foundSubmission = getFoundSubmission()
      Submission.findOne.mockResolvedValueOnce(foundSubmission)
      const h = getResponseToolkit()

      await getSubmissionHandler(request, h)

      expect(h.code).toHaveBeenCalledWith(200)
    })

    it('should return the found submission in the response body', async () => {
      const request = getSubmissionRequest()
      const foundSubmission = getFoundSubmission()
      Submission.findOne.mockResolvedValueOnce(foundSubmission)
      const h = getResponseToolkit()

      await getSubmissionHandler(request, h)

      expect(h.response).toHaveBeenCalledWith({
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
      const request = getSubmissionRequest()
      Submission.findOne.mockResolvedValueOnce(null)
      const h = getResponseToolkit()

      await getSubmissionHandler(request, h)

      expect(h.code).toHaveBeenCalledWith(404)
    })

    it('should log an error if fetching submission fails', async () => {
      const request = getSubmissionRequest()
      const error = new Error('Database error')
      Submission.findOne.mockRejectedValueOnce(error)
      const h = getResponseToolkit()

      await getSubmissionHandler(request, h)

      expect(logger.error).toHaveBeenCalledWith(
        'Error finding submission:',
        error
      )
    })

    it('should return 500 and an error if an error occurs while fetching submission', async () => {
      const request = getSubmissionRequest()
      const error = new Error('Database error')
      Submission.findOne.mockRejectedValueOnce(error)
      const h = getResponseToolkit()

      await getSubmissionHandler(request, h)

      expect(h.response).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unable find submission'
        })
      )
      expect(h.code).toHaveBeenCalledWith(500)
    })
  })
})
