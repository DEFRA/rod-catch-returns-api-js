import {
  createSubmissionSchema,
  getSubmissionByContactAndSeasonSchema,
  getSubmissionBySubmissionIdSchema
} from '../../schemas/submission.schema.js'
import { StatusCodes } from 'http-status-codes'
import { Submission } from '../../entities/index.js'
import logger from '../../utils/logger-utils.js'
import { mapSubmissionToResponse } from '../../mappers/submission.mapper.js'

export default [
  {
    method: 'POST',
    path: '/submissions',
    options: {
      /**
       * Create a new submission in the database
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link Submission}
       */
      handler: async (request, h) => {
        const { contactId, season, status, source } = request.payload
        try {
          const createdSubmission = await Submission.create({
            contactId,
            season,
            status,
            source,
            version: Date.now()
          })

          const response = mapSubmissionToResponse(
            request,
            createdSubmission.toJSON()
          )

          return h.response(response).code(StatusCodes.CREATED)
        } catch (error) {
          logger.error('Error creating submission:', error)
          return h
            .response({ error: 'Unable create submission' })
            .code(StatusCodes.INTERNAL_SERVER_ERROR)
        }
      },
      validate: {
        payload: createSubmissionSchema
      },
      description: 'Create a submission',
      notes: 'Create a submission',
      tags: ['api', 'submissions']
    }
  },
  {
    method: 'GET',
    path: '/submissions/search/getByContactIdAndSeason',
    options: {
      /**
       * Get a submission by contactId and season from the database
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       *     @param {string} request.query.contact_id - The ID of the contact for which the submission is being retrieved.
       *     @param {string} request.query.season - The season year for which the submission is being retrieved.
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link Submission}
       */
      handler: async (request, h) => {
        const contactId = request.query.contact_id
        const season = request.query.season

        try {
          const foundSubmission = await Submission.findOne({
            where: {
              contactId,
              season
            }
          })

          if (foundSubmission) {
            const response = mapSubmissionToResponse(
              request,
              foundSubmission.toJSON()
            )
            return h.response(response).code(StatusCodes.OK)
          }
          return h.response().code(StatusCodes.NOT_FOUND)
        } catch (error) {
          logger.error('Error finding submission:', error)
          return h
            .response({ error: 'Unable find submission' })
            .code(StatusCodes.INTERNAL_SERVER_ERROR)
        }
      },
      validate: {
        query: getSubmissionByContactAndSeasonSchema
      },
      description: 'Get a submission by contactId and season',
      notes: 'Get a submission by contactId and season',
      tags: ['api', 'submissions']
    }
  },
  {
    method: 'GET',
    path: '/submissions/{submissionId}',
    options: {
      /**
       * Get a submission by its submissionId from the database
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       *     @param {string} request.params.submissionId - The ID of the submission to be retrieved.
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link Submission}
       */
      handler: async (request, h) => {
        const submissionId = request.params.submissionId

        try {
          const foundSubmission = await Submission.findOne({
            where: {
              id: submissionId
            }
          })

          if (foundSubmission) {
            const response = mapSubmissionToResponse(
              request,
              foundSubmission.toJSON()
            )
            return h.response(response).code(StatusCodes.OK)
          }
          return h.response().code(StatusCodes.NOT_FOUND)
        } catch (error) {
          logger.error('Error finding submission:', error)
          return h
            .response({ error: 'Unable find submission' })
            .code(StatusCodes.INTERNAL_SERVER_ERROR)
        }
      },
      validate: {
        params: getSubmissionBySubmissionIdSchema
      },
      description: 'Get a submission by submissionId',
      notes: 'Get a submission by submissionId',
      tags: ['api', 'submissions']
    }
  }
]
