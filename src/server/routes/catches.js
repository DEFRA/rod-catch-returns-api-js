import { Activity, Catch } from '../../entities/index.js'
import { handleNotFound, handleServerError } from '../../utils/server-utils.js'
import {
  mapCatchToResponse,
  mapRequestToCatch
} from '../../mappers/catches.mapper.js'
import { StatusCodes } from 'http-status-codes'
import { createCatchSchema } from '../../schemas/catch.schema.js'
import logger from '../../utils/logger-utils.js'
import { mapActivityToResponse } from '../../mappers/activity.mapper.js'

export default [
  {
    method: 'POST',
    path: '/catches',
    options: {
      /**
       * Create a catch (salmon and large sea trout) for an activity in the database
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       *     @param {string} request.payload.activity - The activity id prefixed with activities/
       *     @param {string} request.payload.dateCaught - The ISO 8601 date the catch was recorded (e.g., "2024-06-24T00:00:00+01:00").
       *     @param {string} request.payload.species - The species ID prefixed with "species/".
       *     @param {Object} request.payload.mass - The mass of the catch.
       *     @param {number} request.payload.mass.kg - The mass in kilograms.
       *     @param {number} request.payload.mass.oz - The mass in ounces.
       *     @param {string} request.payload.mass.type - The mass type, typically "IMPERIAL" or "METRIC".
       *     @param {string} request.payload.method - The method ID prefixed with "methods/".
       *     @param {boolean} request.payload.released - Indicates if the catch was released.
       *     @param {boolean} request.payload.onlyMonthRecorded - Indicates if only the month was recorded, to allow FMT users to report on the default dates
       *     @param {boolean} request.payload.noDateRecorded - Indicates if no specific date was recorded, to allow FMT users to report on the default month
       *     @param {string} request.payload.reportingExclude - Is this entry excluded from reporting
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link Catch}
       */
      handler: async (request, h) => {
        try {
          const catchData = mapRequestToCatch(request.payload)

          const createdCatch = await Catch.create(catchData)

          const catchResponse = mapCatchToResponse(
            request,
            createdCatch.toJSON()
          )

          return h.response(catchResponse).code(StatusCodes.CREATED)
        } catch (error) {
          logger.error('Error create catch:', error)
          return h
            .response({ error: 'Unable to create catch' })
            .code(StatusCodes.INTERNAL_SERVER_ERROR)
        }
      },
      validate: {
        payload: createCatchSchema
      },
      description:
        'Create a catch (salmon and large sea trout) for an activity in the database',
      notes:
        'Create a catch (salmon and large sea trout) for an activity in the database',
      tags: ['api', 'catches']
    }
  },
  {
    method: 'GET',
    path: '/catches/{catchId}/activity',
    options: {
      /**
       * Retrieve the activity associated with a catch using the catch ID from the database
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       *     @param {string} request.params.catchId - The ID of the catch.
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link Activity}
       */
      handler: async (request, h) => {
        const catchId = request.params.catchId

        try {
          const catchWithActivity = await Catch.findOne({
            where: {
              id: catchId
            },
            include: [
              {
                model: Activity,
                required: true // Ensures the join will only return results if an associated Activity exists
              }
            ]
          })

          if (!catchWithActivity) {
            return handleNotFound(
              `Activity not found for catch with ID ${catchId}`,
              h
            )
          }

          const foundActivity = catchWithActivity.Activity
          const response = mapActivityToResponse(
            request,
            foundActivity.toJSON()
          )

          return h.response(response).code(StatusCodes.OK)
        } catch (error) {
          return handleServerError(
            'Error fetching activity for catch',
            error,
            h
          )
        }
      },
      // TODO add validator
      // validate: {
      //   params: getBySubmissionIdSchema
      // },
      description: 'Retrieve the activity associated with a catch',
      notes:
        'Retrieve the activity associated with a catch using the catch ID from the database',
      tags: ['api', 'catches']
    }
  }
]
