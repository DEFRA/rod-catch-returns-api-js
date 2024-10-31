import {
  mapRequestToSmallCatch,
  mapSmallCatchToResponse
} from '../../mappers/small-catches.mapper.js'
import { SmallCatch } from '../../entities/index.js'
import { StatusCodes } from 'http-status-codes'
import logger from '../../utils/logger-utils.js'

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
       *     @param {string[]} request.payload.counts - An array of small catches counts // TODO do this properly
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
            smallCatch
          )

          return h.response(smallCatchResponse).code(StatusCodes.CREATED)
        } catch (error) {
          logger.error('Error create small catch:', error)
          return h
            .response({ error: 'Unable to create small catch' })
            .code(StatusCodes.INTERNAL_SERVER_ERROR)
        }
      },
      description: 'Create a small catch for an activity in the database',
      notes: 'Create a small catch for an activity in the database',
      tags: ['api', 'smallCatches']
    }
  }
]
