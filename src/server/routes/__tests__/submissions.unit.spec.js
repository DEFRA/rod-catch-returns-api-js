import { Submission } from '../../../entities/index.js'
import logger from '../../../utils/logger-utils.js'
import routes from '../submissions.js'

jest.mock('../../../entities/index.js')
jest.mock('../../../utils/logger-utils.js')

const postSubmissionHandler = routes[0].options.handler

describe('submissions.unit', () => {
  describe('POST /submissions', () => {
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
      version: Date.now()
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
})
