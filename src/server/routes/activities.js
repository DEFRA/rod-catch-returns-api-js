import { Activity, Catch, River, SmallCatch } from '../../entities/index.js'
import {
  extractRiverId,
  extractSubmissionId
} from '../../utils/entity-utils.js'
import { StatusCodes } from 'http-status-codes'
import { createActivitySchema } from '../../schemas/activities.schema.js'
import logger from '../../utils/logger-utils.js'
import { mapActivityToResponse } from '../../mappers/activity.mapper.js'
import { mapCatchToResponse } from '../../mappers/catches.mapper.js'
import { mapRiverToResponse } from '../../mappers/river.mapper.js'
import { mapSmallCatchToResponse } from '../../mappers/small-catches.mapper.js'

export default [
  {
    method: 'POST',
    path: '/activities',
    options: {
      /**
       * Create an activity for a submission in the database
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
      description: 'Create an activity for a submission in the database',
      notes: 'Create an activity for a submission in the database',
      tags: ['api', 'activities']
    }
  },
  {
    method: 'GET',
    path: '/activities/{activityId}/river',
    options: {
      /**
       * Retrieve the river associated with an activity
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       *     @param {string} request.params.activityId - The activity id
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link River}
       */
      handler: async (request, h) => {
        try {
          const activityId = request.params.activityId
          const activity = await Activity.findOne({
            where: { id: activityId },
            include: [
              {
                model: River,
                required: true
              }
            ]
          })

          if (!activity) {
            logger.error('Activity not found or has no associated river')
            return h.response().code(StatusCodes.NOT_FOUND)
          }

          const mappedRiver = mapRiverToResponse(
            request,
            activity.River.toJSON()
          )

          return h.response(mappedRiver).code(StatusCodes.OK)
        } catch (error) {
          logger.error('Error fetching river for activity:', error)
          return h
            .response({ error: 'Unable to fetch river for activity' })
            .code(StatusCodes.INTERNAL_SERVER_ERROR)
        }
      },
      description:
        'Retrieve the river associated with an activity in the database',
      notes: 'Retrieve river associated with an activity in the database',
      tags: ['api', 'activities']
    }
  },
  {
    method: 'GET',
    path: '/activities/{activityId}/smallCatches',
    options: {
      /**
       * Retrieve the small catches associated with an activity
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       *     @param {string} request.params.activityId - The activity id
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link SmallCatch}
       */
      handler: async (request, h) => {
        try {
          const activityId = request.params.activityId
          const activityWithCatches = await Activity.findOne({
            where: { id: activityId },
            include: [
              {
                model: SmallCatch,
                include: [
                  {
                    association: 'counts'
                  }
                ]
              }
            ]
          })

          if (!activityWithCatches) {
            logger.error(`Small catches not found for ${activityId}`)
            return h.response().code(StatusCodes.NOT_FOUND)
          }

          const mappedSmallCatches = (
            activityWithCatches.SmallCatches || []
          ).map((smallCatch) => mapSmallCatchToResponse(request, smallCatch))

          return h
            .response({
              _embedded: {
                smallCatches: mappedSmallCatches
              }
            })
            .code(StatusCodes.OK)
        } catch (error) {
          logger.error('Error fetching small catches:', error)
          return h
            .response({ error: 'Unable to fetch small catches for activity' })
            .code(StatusCodes.INTERNAL_SERVER_ERROR)
        }
      },
      description:
        'Retrieve the small catches associated with an activity in the database',
      notes: 'Retrieve small catches with an activity in the database',
      tags: ['api', 'activities']
    }
  },
  {
    method: 'GET',
    path: '/activities/{activityId}/catches',
    options: {
      /**
       * Retrieve the catches (salmon and large sea trout) associated with an activity
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       *     @param {string} request.params.activityId - The activity id
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link Catch}
       */
      handler: async (request, h) => {
        try {
          const activityId = request.params.activityId
          const activityWithCatches = await Activity.findOne({
            where: { id: activityId },
            include: [
              {
                model: Catch
              }
            ]
          })

          if (!activityWithCatches) {
            logger.error(`Catches not found for ${activityId}`)
            return h.response().code(StatusCodes.NOT_FOUND)
          }

          const mappedCatches = (activityWithCatches.Catches || []).map(
            (catchEntity) => mapCatchToResponse(request, catchEntity)
          )

          return h
            .response({
              _embedded: {
                catches: mappedCatches
              }
            })
            .code(StatusCodes.OK)
        } catch (error) {
          logger.error('Error fetching catches:', error)
          return h
            .response({ error: 'Unable to fetch catches for activity' })
            .code(StatusCodes.INTERNAL_SERVER_ERROR)
        }
      },
      description:
        'Retrieve the catches (salmon and large sea trout) associated with an activity in the database',
      notes:
        'Retrieve catches (salmon and large sea trout) with an activity in the database',
      tags: ['api', 'activities']
    }
  }
]
