import { River } from '../../entities/river.entity.js'
import { StatusCodes } from 'http-status-codes'
import logger from '../../utils/logger-utils.js'

export default [
  {
    method: 'GET',
    path: '/rivers',
    options: {
      /**
       * Retrieve all the rivers in the database
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link River}
       */
      handler: async (_request, h) => {
        try {
          const rivers = await River.findAll()
          return h
            .response({
              _embedded: {
                rivers
              }
            })
            .code(StatusCodes.OK)
        } catch (error) {
          logger.error('Error fetching rivers:', error)
          return h
            .response({ error: 'Unable to fetch rivers' })
            .code(StatusCodes.INTERNAL_SERVER_ERROR)
        }
      },
      description: 'Retrieve all the rivers in the database',
      notes: 'Retrieve all the rivers in the database',
      tags: ['api', 'rivers']
    }
  }
]
