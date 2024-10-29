import { Activity } from '../../entities/index.js'
import { StatusCodes } from 'http-status-codes'
import { createActivitySchema } from '../../schemas/activities.schema.js'
import logger from '../../utils/logger-utils.js'
import { mapActivityToResponse } from '../../mappers/activity.mapper.js'
import {
  extractRiverId,
  extractSubmissionId
} from '../../utils/entity-utils.js'

export default [
  {
    method: 'POST',
    path: '/activities',
    options: {
      /**
       * Retrieve all the catchments in the database
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       *     @param {string} request.payload.submission - The submission id prefixed with submissions/
       *     @param {string} request.payload.daysFishedWithMandatoryRelease - The number of days fished during the mandatory release period
       *     @param {string} request.payload.daysFishedOther - The number of days fished at other times during the season
       *     @param {string} request.payload.river - The submission id prefixed with rivers/
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link Activity}
       */
      handler: async (request, h) => {
        try {
          const {
            submission,
            daysFishedWithMandatoryRelease,
            daysFishedOther,
            river
          } = request.payload

          const submissionId = extractSubmissionId(submission)
          const riverId = extractRiverId(river)

          const createdActivity = await Activity.create({
            daysFishedOther,
            daysFishedWithMandatoryRelease,
            submission_id: submissionId,
            river_id: riverId,
            version: Date.now()
          })

          const response = mapActivityToResponse(
            request,
            createdActivity.toJSON()
          )

          return h.response(response).code(StatusCodes.CREATED)
        } catch (error) {
          logger.error('Error create activity:', error)
          return h
            .response({ error: 'Unable to create activity' })
            .code(StatusCodes.INTERNAL_SERVER_ERROR)
        }
      },
      validate: {
        payload: createActivitySchema
      },
      description: 'Create an activity in the database',
      notes: 'Create an activity in the database',
      tags: ['api', 'activities']
    }
  }
]
