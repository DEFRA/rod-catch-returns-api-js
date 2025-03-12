import { Catchment } from '../../entities/index.js'
import { StatusCodes } from 'http-status-codes'
import { handleServerError } from '../../utils/server-utils.js'

export default [
  {
    method: 'GET',
    path: '/catchments',
    options: {
      /**
       * Retrieve all the catchments in the database
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link Catchment}
       */
      handler: async (_request, h) => {
        try {
          const catchments = await Catchment.findAll()

          return h
            .response({
              _embedded: {
                catchments
              }
            })
            .code(StatusCodes.OK)
        } catch (error) {
          return handleServerError('Error fetching catchments', error, h)
        }
      },
      description: 'Retrieve all the catchments in the database',
      notes: 'Retrieve all the catchments in the database',
      tags: ['api', 'catchments']
    }
  }
]
