import { Activity, SmallCatch } from '../../entities/index.js'
import {
  createSmallCatchSchema,
  smallCatchIdSchema
} from '../../schemas/small-catch.schema.js'
import { handleNotFound, handleServerError } from '../../utils/server-utils.js'
import {
  mapRequestToSmallCatch,
  mapSmallCatchToResponse
} from '../../mappers/small-catches.mapper.js'
import { StatusCodes } from 'http-status-codes'
import { mapActivityToResponse } from '../../mappers/activity.mapper.js'

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

          const smallCatch = await SmallCatch.create(smallCatchData, {
            include: [{ association: SmallCatch.associations.counts }]
          })

          const smallCatchResponse = mapSmallCatchToResponse(
            request,
            smallCatch.toJSON()
          )

          return h.response(smallCatchResponse).code(StatusCodes.CREATED)
        } catch (error) {
          return handleServerError('Error creating small catch', error, h)
        }
      },
      validate: {
        payload: createSmallCatchSchema
      },
      description: 'Create a small catch for an activity in the database',
      notes: 'Create a small catch for an activity in the database',
      tags: ['api', 'smallCatches']
    }
  },
  {
    method: 'GET',
    path: '/smallCatches/{smallCatchId}/activity',
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
          const response = mapActivityToResponse(request, foundActivity)

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
    path: '/smallCatches/{smallCatchId}',
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

          const mappedSmallCatch = mapSmallCatchToResponse(
            request,
            smallCatch.toJSON()
          )

          return h.response(mappedSmallCatch).code(StatusCodes.OK)
        } catch (error) {
          return handleServerError('Error fetching small catch by ID', error, h)
        }
      },
      description: 'Retrieve a small catch by its ID',
      notes: 'Retrieve a small catch from the database by its ID',
      tags: ['api', 'smallCatches']
    }
  }
]
