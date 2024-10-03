import { Region } from '../../entities/index.js'
import { StatusCodes } from 'http-status-codes'
import logger from '../../utils/logger-utils.js'

export default [
  {
    method: 'GET',
    path: '/regions',
    options: {
      /**
       * Retrieve all the regions in the database
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link Region}
       */
      handler: async (_request, h) => {
        try {
          const regions = await Region.findAll()
          return h
            .response({
              _embedded: {
                regions
              }
            })
            .code(StatusCodes.OK)
        } catch (error) {
          logger.error('Error fetching regions:', error)
          return h
            .response({ error: 'Unable to fetch regions' })
            .code(StatusCodes.INTERNAL_SERVER_ERROR)
        }
      },
      description: 'Retrieve all the regions in the database',
      notes: 'Retrieve all the regions in the database',
      tags: ['api', 'regions']
    }
  }
]
