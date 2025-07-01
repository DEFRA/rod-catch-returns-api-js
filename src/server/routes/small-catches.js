import { Activity, SmallCatch, SmallCatchCount } from '../../entities/index.js'
import {
  createSmallCatchSchema,
  smallCatchIdSchema,
  updateSmallCatchSchema
} from '../../schemas/small-catch.schema.js'
import { handleNotFound, handleServerError } from '../../utils/server-utils.js'
import {
  mapCounts,
  mapRequestToSmallCatch,
  mapSmallCatchToResponse
} from '../../mappers/small-catches.mapper.js'
import { StatusCodes } from 'http-status-codes'
import logger from '../../utils/logger-utils.js'
import { mapActivityToResponse } from '../../mappers/activities.mapper.js'
import { sequelize } from '../../services/database.service.js'

const BASE_SMALL_CATCHES_URL = '/smallCatches/{smallCatchId}'

export default [
  {
    method: 'POST',
    path: '/smallCatches',
    options: {
      /**
       * Create a small catch for an activity in the database
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       *     @param {string} request.payload.activity - The activity id prefixed with activities/
       *     @param {string} request.payload.month - The full month in capitals this record relates to
       *     @param {string} request.payload.released - The number released
       *     @param {Array<{ method: string, count: string }>} request.payload.counts - An array of small catch counts, each with a fishing method and its count
       *     @param {string} request.payload.noMonthRecorded - To allow FMT users to report on the default date
       *     @param {string} request.payload.reportingExclude - Is this entry excluded from reporting
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link Activity}
       */
      handler: async (request, h) => {
        try {
          const smallCatchData = mapRequestToSmallCatch(request.payload)

          logger.info('Creating small catch with details', smallCatchData)

          const smallCatch = await SmallCatch.create(smallCatchData, {
            include: [{ association: SmallCatch.associations.counts }]
          })

          const smallCatchResponse = mapSmallCatchToResponse(
            smallCatch.toJSON()
          )

          return h.response(smallCatchResponse).code(StatusCodes.CREATED)
        } catch (error) {
          return handleServerError('Error creating small catch', error, h)
        }
      },
      validate: {
        payload: createSmallCatchSchema,
        options: { entity: 'SmallCatch' }
      },
      description: 'Create a small catch for an activity in the database',
      notes: 'Create a small catch for an activity in the database',
      tags: ['api', 'smallCatches']
    }
  },
  {
    method: 'GET',
    path: `${BASE_SMALL_CATCHES_URL}/activity`,
    options: {
      /**
       * Retrieve the activity associated with a small catch using the smallc catch ID from the database
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       *     @param {string} request.params.smallCatchId - The ID of the small catch.
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link Activity}
       */
      handler: async (request, h) => {
        const smallCatchId = request.params.smallCatchId

        try {
          const smallCatchWithActivity = await SmallCatch.findOne({
            where: {
              id: smallCatchId
            },
            include: [
              {
                model: Activity,
                required: true // Ensures the join will only return results if an associated Activity exists
              }
            ]
          })

          if (!smallCatchWithActivity) {
            return handleNotFound(
              `Activity not found for small catch with ID ${smallCatchId}`,
              h
            )
          }

          const foundActivity = smallCatchWithActivity.toJSON().Activity
          const response = mapActivityToResponse(foundActivity)

          return h.response(response).code(StatusCodes.OK)
        } catch (error) {
          return handleServerError(
            'Error fetching activity for small catch',
            error,
            h
          )
        }
      },
      validate: {
        params: smallCatchIdSchema
      },
      description: 'Retrieve the activity associated with a small catch',
      notes:
        'Retrieve the activity associated with a small catch using the small catch ID from the database',
      tags: ['api', 'smallCatches']
    }
  },
  {
    method: 'GET',
    path: BASE_SMALL_CATCHES_URL,
    options: {
      /**
       * Retrieve a small catch by its ID
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       *     @param {string} request.params.smallCatchId - The small catch id
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link SmallCatch}
       */
      handler: async (request, h) => {
        try {
          const smallCatchId = request.params.smallCatchId
          const smallCatch = await SmallCatch.findOne({
            where: { id: smallCatchId },
            include: [{ association: SmallCatch.associations.counts }]
          })

          if (!smallCatch) {
            return handleNotFound(
              `Small catch not found for ID: ${smallCatchId}`,
              h
            )
          }

          const mappedSmallCatch = mapSmallCatchToResponse(smallCatch.toJSON())

          return h.response(mappedSmallCatch).code(StatusCodes.OK)
        } catch (error) {
          return handleServerError('Error fetching small catch by ID', error, h)
        }
      },
      validate: {
        params: smallCatchIdSchema
      },
      description: 'Retrieve a small catch by its ID',
      notes: 'Retrieve a small catch from the database by its ID',
      tags: ['api', 'smallCatches']
    }
  },
  {
    method: 'DELETE',
    path: BASE_SMALL_CATCHES_URL,
    options: {
      /**
       * Delete an small catch by ID
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       *     @param {string} request.params.smallCatchId - The small catch id
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response indicating success or failure
       */
      handler: async (request, h) => {
        const smallCatchId = request.params.smallCatchId

        // Begin transaction for atomic operation
        const transaction = await sequelize.transaction()

        try {
          logger.info(
            `Deleting small catches with id:%s and related records`,
            smallCatchId
          )
          await SmallCatchCount.destroy({
            where: { small_catch_id: smallCatchId },
            transaction
          })

          const smallCatchesDestroyed = await SmallCatch.destroy({
            where: { id: smallCatchId },
            transaction
          })

          if (smallCatchesDestroyed === 0) {
            await transaction.rollback()
            return handleNotFound(
              `Small catch not found for ID: ${smallCatchId}`,
              h
            )
          }

          // Commit transaction
          await transaction.commit()

          logger.info(
            `Deleted small catches with id:%s and related records`,
            smallCatchId
          )
          return h.response().code(StatusCodes.NO_CONTENT)
        } catch (error) {
          await transaction.rollback()
          return handleServerError('Error deleting small catch', error, h)
        }
      },
      validate: {
        params: smallCatchIdSchema
      },
      description: 'Delete a small catch by ID',
      notes: 'Deletes a small catch from the database by its ID',
      tags: ['api', 'smallCatches']
    }
  },
  {
    method: 'PATCH',
    path: BASE_SMALL_CATCHES_URL,
    options: {
      /**
       * Update a small catch in the database using the small catch ID
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       *     @param {string} request.params.smallCatchId - The ID of the small catch to update
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link SmallCatch}
       */
      handler: async (request, h) => {
        const { smallCatchId } = request.params
        const { month, released, counts, noMonthRecorded, reportingExclude } =
          request.payload

        const transaction = await sequelize.transaction()

        try {
          const foundSmallCatch = await SmallCatch.findOne({
            where: { id: smallCatchId },
            include: [{ association: SmallCatch.associations.counts }]
          })

          if (!foundSmallCatch) {
            return handleNotFound(
              `Small Catch not found for ${smallCatchId}`,
              h
            )
          }

          const smallCatchData = mapRequestToSmallCatch({
            month,
            released,
            noMonthRecorded,
            reportingExclude
          })

          logger.info(
            `Updating small catch ${smallCatchId} with details`,
            smallCatchData
          )

          // if a value is undefined, it is not updated by Sequelize
          const updatedSmallCatch = await foundSmallCatch.update(
            smallCatchData,
            { transaction }
          )
          // counts does not get updated because it's an association, that has to be done separately
          // performing updates and deletions involving nested objects is currently not possible.
          // For that, you will have to perform each separate action explicitly.
          // https://sequelize.org/docs/v6/advanced-association-concepts/creating-with-associations/
          let countRecords = foundSmallCatch.counts
          if (counts && Array.isArray(counts)) {
            countRecords = mapCounts(counts, smallCatchId)
            // Delete existing counts for the SmallCatch
            await SmallCatchCount.destroy({
              where: { small_catch_id: smallCatchId },
              transaction
            })

            // Insert the new counts
            await SmallCatchCount.bulkCreate(countRecords, { transaction })
          }

          await transaction.commit()

          const mappedSmallCatch = mapSmallCatchToResponse({
            ...updatedSmallCatch.toJSON(),
            countRecords
          })

          return h.response(mappedSmallCatch).code(StatusCodes.OK)
        } catch (error) {
          await transaction.rollback()
          return handleServerError('Error updating small catch', error, h)
        }
      },
      validate: {
        params: smallCatchIdSchema,
        payload: updateSmallCatchSchema,
        options: { entity: 'SmallCatch' }
      },
      description: 'Update a small catch',
      notes: 'Update a small catch',
      tags: ['api', 'smallCatches']
    }
  }
]
