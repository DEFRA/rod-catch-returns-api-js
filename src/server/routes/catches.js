import {
  mapCatchToResponse,
  mapRequestToCatch
} from '../../mappers/catches.mapper.js'
import { Catch } from '../../entities/index.js'
import { StatusCodes } from 'http-status-codes'
import logger from '../../utils/logger-utils.js'

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
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link Activity}
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
      description:
        'Create a catch (salmon and large sea trout) for an activity in the database',
      notes:
        'Create a catch (salmon and large sea trout) for an activity in the database',
      tags: ['api', 'catches']
    }
  }
]
