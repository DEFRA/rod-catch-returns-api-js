import {
  Activity,
  Catch,
  River,
  SmallCatch,
  SmallCatchCount,
  Submission
} from '../../entities/index.js'
import {
  createActivitySchema,
  updateActivitySchema
} from '../../schemas/activities.schema.js'
import {
  extractRiverId,
  extractSubmissionId
} from '../../utils/entity-utils.js'
import { handleNotFound, handleServerError } from '../../utils/server-utils.js'
import { StatusCodes } from 'http-status-codes'
import logger from '../../utils/logger-utils.js'
import { mapActivityToResponse } from '../../mappers/activities.mapper.js'
import { mapCatchToResponse } from '../../mappers/catches.mapper.js'
import { mapRiverToResponse } from '../../mappers/river.mapper.js'
import { mapSmallCatchToResponse } from '../../mappers/small-catches.mapper.js'
import { mapSubmissionToResponse } from '../../mappers/submission.mapper.js'
import { sequelize } from '../../services/database.service.js'

const BASE_ACTIVITIES_URL = '/activities/{activityId}'

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

          const activityData = {
            submission_id: extractSubmissionId(submission),
            river_id: extractRiverId(river),
            daysFishedWithMandatoryRelease,
            daysFishedOther,
            version: new Date()
          }

          logger.info('Creating activity with details', activityData)

          const createdActivity = await Activity.create(activityData)

          const response = mapActivityToResponse(createdActivity.toJSON())

          return h.response(response).code(StatusCodes.CREATED)
        } catch (error) {
          return handleServerError('Error creating activity', error, h)
        }
      },
      validate: {
        payload: createActivitySchema,
        options: { entity: 'Activity' }
      },
      description: 'Create an activity for a submission in the database',
      notes: 'Create an activity for a submission in the database',
      tags: ['api', 'activities']
    }
  },
  {
    method: 'GET',
    path: `${BASE_ACTIVITIES_URL}/river`,
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
            return handleNotFound(
              'Activity not found or has no associated river',
              h
            )
          }

          const mappedRiver = mapRiverToResponse(activity.River.toJSON())

          return h.response(mappedRiver).code(StatusCodes.OK)
        } catch (error) {
          return handleServerError(
            'Error fetching river for activity',
            error,
            h
          )
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
    path: `${BASE_ACTIVITIES_URL}/smallCatches`,
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
            return handleNotFound(
              `Small catches not found for ${activityId}`,
              h
            )
          }

          const mappedSmallCatches = (
            activityWithCatches.SmallCatches || []
          ).map((smallCatch) => mapSmallCatchToResponse(smallCatch))

          return h
            .response({
              _embedded: {
                smallCatches: mappedSmallCatches
              }
            })
            .code(StatusCodes.OK)
        } catch (error) {
          return handleServerError('Error fetching small catches', error, h)
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
    path: `${BASE_ACTIVITIES_URL}/catches`,
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
            return handleNotFound(`Catches not found for ${activityId}`, h)
          }

          const mappedCatches = (activityWithCatches.Catches || []).map(
            (catchEntity) => mapCatchToResponse(catchEntity)
          )

          return h
            .response({
              _embedded: {
                catches: mappedCatches
              }
            })
            .code(StatusCodes.OK)
        } catch (error) {
          return handleServerError('Error fetching catches', error, h)
        }
      },
      description:
        'Retrieve the catches (salmon and large sea trout) associated with an activity in the database',
      notes:
        'Retrieve catches (salmon and large sea trout) with an activity in the database',
      tags: ['api', 'activities']
    }
  },
  {
    method: 'GET',
    path: BASE_ACTIVITIES_URL,
    options: {
      /**
       * Retrieve an activity by its ID
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       *     @param {string} request.params.activityId - The activity id
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link Activity}
       */
      handler: async (request, h) => {
        try {
          const activityId = request.params.activityId
          const activity = await Activity.findOne({
            where: { id: activityId }
          })

          if (!activity) {
            return handleNotFound(`Activity not found for ID: ${activityId}`, h)
          }

          const mappedActivity = mapActivityToResponse(activity.toJSON())

          return h.response(mappedActivity).code(StatusCodes.OK)
        } catch (error) {
          return handleServerError('Error fetching activity by ID', error, h)
        }
      },
      description: 'Retrieve an activity by its ID',
      notes: 'Retrieve an activity from the database by its ID',
      tags: ['api', 'activities']
    }
  },
  {
    method: 'DELETE',
    path: BASE_ACTIVITIES_URL,
    options: {
      /**
       * Delete an activity by ID
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       *     @param {string} request.params.activityId - The activity id
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response indicating success or failure
       */
      handler: async (request, h) => {
        const activityId = request.params.activityId

        // Begin transaction for atomic operation
        const transaction = await sequelize.transaction()

        try {
          // Find IDs of all SmallCatch records associated with the Activity
          logger.info(
            'Deleting activity with id:%s and related records',
            activityId
          )
          const smallCatchIds = (
            await SmallCatch.findAll({
              attributes: ['id'],
              where: { activity_id: activityId },
              transaction
            })
          )?.map((smallCatch) => smallCatch.id)

          // Delete associated SmallCatchCount
          await SmallCatchCount.destroy({
            where: { small_catch_id: smallCatchIds },
            transaction
          })

          // Delete associated SmallCatches
          await SmallCatch.destroy({
            where: { activity_id: activityId },
            transaction
          })

          // Delete associated Catches
          await Catch.destroy({
            where: { activity_id: activityId },
            transaction
          })

          // Delete the Activity
          const deletedCount = await Activity.destroy({
            where: { id: activityId },
            transaction
          })

          if (deletedCount === 0) {
            await transaction.rollback()
            return handleNotFound(`Activity with ID ${activityId} not found`, h)
          }

          // Commit transaction
          await transaction.commit()

          logger.info(
            'Deleted activity with id: %s and related records',
            activityId
          )
          return h.response().code(StatusCodes.NO_CONTENT)
        } catch (error) {
          await transaction.rollback()
          return handleServerError('Error deleting activity', error, h)
        }
      },
      description: 'Delete an activity by ID',
      notes: 'Deletes an activity from the database by its ID',
      tags: ['api', 'activities']
    }
  },
  {
    method: 'PATCH',
    path: BASE_ACTIVITIES_URL,
    options: {
      /**
       * Update a activities in the database using the activities ID
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       *     @param {string} request.params.activityId - The ID of the activity to update
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link Activity}
       */
      handler: async (request, h) => {
        const { activityId } = request.params
        const { daysFishedWithMandatoryRelease, daysFishedOther, river } =
          request.payload

        try {
          const activity = await Activity.findByPk(activityId)

          if (!activity) {
            return handleNotFound(`Activity not found for ${activityId}`, h)
          }

          const activityData = {
            river_id: river ? extractRiverId(river) : undefined,
            daysFishedWithMandatoryRelease,
            daysFishedOther,
            version: new Date()
          }

          logger.info(
            `Updating activity ${activityId} with details`,
            activityData
          )

          // if a value is undefined, it is not updated by Sequelize
          const updatedActivity = await activity.update(activityData)

          const mappedActivity = mapActivityToResponse(updatedActivity.toJSON())

          return h.response(mappedActivity).code(StatusCodes.OK)
        } catch (error) {
          return handleServerError('Error updating activity', error, h)
        }
      },
      validate: {
        payload: updateActivitySchema,
        options: { entity: 'Activity' }
      },
      description: 'Update an activity',
      notes: 'Update an activity',
      tags: ['api', 'activities']
    }
  },
  {
    method: 'GET',
    path: `${BASE_ACTIVITIES_URL}/submission`,
    options: {
      /**
       * Retrieve the submission associated with an activity
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       *     @param {string} request.params.activityId - The activity id
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link Submission}
       */
      handler: async (request, h) => {
        try {
          const activityId = request.params.activityId
          const activity = await Activity.findOne({
            where: { id: activityId },
            include: [
              {
                model: Submission,
                required: true
              }
            ]
          })

          if (!activity) {
            return handleNotFound(
              'Activity not found or has no associated submission',
              h
            )
          }

          const mappedSubmission = mapSubmissionToResponse(
            activity.Submission.toJSON()
          )

          return h.response(mappedSubmission).code(StatusCodes.OK)
        } catch (error) {
          return handleServerError(
            'Error fetching submission for activity',
            error,
            h
          )
        }
      },
      description:
        'Retrieve the submission associated with an activity in the database',
      notes: 'Retrieve submission associated with an activity in the database',
      tags: ['api', 'activities']
    }
  }
]
