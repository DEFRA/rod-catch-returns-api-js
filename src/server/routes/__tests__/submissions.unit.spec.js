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

    const getSubmissionPayload = () => ({
      contactId: 'contact-identifier-111',
      season: '2024',
      status: 'INCOMPLETE',
      source: 'WEB'
    })

    const getCreatedSubmission = () => ({
      id: '1',
      contactId: 'contact-identifier-111',
      season: '2024',
      status: 'INCOMPLETE',
      source: 'WEB',
      version: Date.now(),
      reportingExclude: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return a 201 status code if the submission is created successfully', async () => {
      const payload = getSubmissionPayload()
      const createdSubmission = getCreatedSubmission()
      Submission.create.mockResolvedValueOnce(createdSubmission)
      const h = getResponseToolkit()

      await postSubmissionHandler({ payload }, h)

      expect(h.code).toHaveBeenCalledWith(201)
    })

    it('should return the created submission in the response body', async () => {
      const payload = getSubmissionPayload()
      const createdSubmission = getCreatedSubmission()
      Submission.create.mockResolvedValueOnce(createdSubmission)
      const h = getResponseToolkit()

      await postSubmissionHandler({ payload }, h)

      expect(h.response).toHaveBeenCalledWith(createdSubmission)
    })

    it('should log an error if submission creation fails', async () => {
      const payload = getSubmissionPayload()
      const error = new Error('Database error')
      Submission.create.mockRejectedValueOnce(error)
      const h = getResponseToolkit()

      await postSubmissionHandler({ payload }, h)

      expect(logger.error).toHaveBeenCalledWith(
        'Error creating submission:',
        error
      )
    })

    it('should return 500 and an error if an error occurs while creating submission', async () => {
      const payload = getSubmissionPayload()
      const error = new Error('Database error')
      Submission.create.mockRejectedValueOnce(error)
      const h = getResponseToolkit()

      await postSubmissionHandler({ payload }, h)

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

    const getQuery = () => ({
      contact_id: 'contact-identifier-111',
      season: '2024'
    })

    const getFoundSubmission = () => ({
      id: '1',
      contactId: 'contact-identifier-111',
      season: '2024',
      status: 'COMPLETE',
      source: 'WEB',
      version: Date.now(),
      reportingExclude: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return a 200 status code if the submission is found', async () => {
      const query = getQuery()
      const foundSubmission = getFoundSubmission()
      Submission.findOne.mockResolvedValueOnce(foundSubmission)
      const h = getResponseToolkit()

      await getSubmissionHandler({ query }, h)

      expect(h.code).toHaveBeenCalledWith(200)
    })

    it('should return the found submission in the response body', async () => {
      const query = getQuery()
      const foundSubmission = getFoundSubmission()
      Submission.findOne.mockResolvedValueOnce(foundSubmission)
      const h = getResponseToolkit()

      await getSubmissionHandler({ query }, h)

      expect(h.response).toHaveBeenCalledWith(foundSubmission)
    })

    it('should return 404 if the submission is not found', async () => {
      const query = getQuery()
      Submission.findOne.mockResolvedValueOnce(null)
      const h = getResponseToolkit()

      await getSubmissionHandler({ query }, h)

      expect(h.code).toHaveBeenCalledWith(404)
    })

    it('should log an error if fetching submission fails', async () => {
      const query = getQuery()
      const error = new Error('Database error')
      Submission.findOne.mockRejectedValueOnce(error)
      const h = getResponseToolkit()

      await getSubmissionHandler({ query }, h)

      expect(logger.error).toHaveBeenCalledWith(
        'Error finding submission:',
        error
      )
    })

    it('should return 500 and an error if an error occurs while fetching submission', async () => {
      const query = getQuery()
      const error = new Error('Database error')
      Submission.findOne.mockRejectedValueOnce(error)
      const h = getResponseToolkit()

      await getSubmissionHandler({ query }, h)

      expect(h.response).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unable find submission'
        })
      )
      expect(h.code).toHaveBeenCalledWith(500)
    })
  })
})
