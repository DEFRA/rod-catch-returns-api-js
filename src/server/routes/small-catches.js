import { StatusCodes } from 'http-status-codes'
import { extractActivityId } from '../../utils/entity-utils.js'
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
          const {
            activity,
            month,
            released,
            counts,
            noMonthRecorded,
            reportingExclude
          } = request.payload

          const activityId = extractActivityId(activity)
          return h.response([]).code(StatusCodes.CREATED)
        } catch (error) {
          logger.error('Error create small catch:', error)
          return h
            .response({ error: 'Unable to create small catche' })
            .code(StatusCodes.INTERNAL_SERVER_ERROR)
        }
      },
      description: 'Create a small catch for an activity in the database',
      notes: 'Create a small catch for an activity in the database',
      tags: ['api', 'smallCatches']
    }
  }
]
