import { Species } from '../../entities/index.js'
import { StatusCodes } from 'http-status-codes'
import logger from '../../utils/logger-utils.js'

export default [
  {
    method: 'GET',
    path: '/species',
    options: {
      /**
       * Retrieve all the species in the database
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link Species}
       */
      handler: async (_request, h) => {
        try {
          const species = await Species.findAll()
          return h
            .response({
              _embedded: {
                species
              }
            })
            .code(StatusCodes.OK)
        } catch (error) {
          logger.error('Error fetching species:', error)
          return h
            .response({ error: 'Unable to fetch species' })
            .code(StatusCodes.INTERNAL_SERVER_ERROR)
        }
      },
      description: 'Retrieve all the species in the database',
      notes: 'Retrieve all the species in the database',
      tags: ['api', 'species']
    }
  }
]
