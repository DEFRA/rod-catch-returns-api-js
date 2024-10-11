import { StatusCodes } from 'http-status-codes'
import { Submission } from '../../entities/index.js'
import { createSubmissionSchema } from '../../schema/submission.schema.js'
import logger from '../../utils/logger-utils.js'

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
          return h.response(createdSubmission).code(StatusCodes.CREATED)
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
  }
]
