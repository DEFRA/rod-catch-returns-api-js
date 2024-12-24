import { River } from '../../entities/index.js'
import { StatusCodes } from 'http-status-codes'
import { handleServerError } from '../../utils/server-utils.js'
import { mapRiverToResponse } from '../../mappers/river.mapper.js'

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
      handler: async (request, h) => {
        try {
          const foundRivers = await River.findAll()

          const mappedRivers = foundRivers.map((river) =>
            mapRiverToResponse(request, river)
          )

          return h
            .response({
              _embedded: {
                rivers: mappedRivers
              }
            })
            .code(StatusCodes.OK)
        } catch (error) {
          return handleServerError('Error fetching rivers', error, h)
        }
      },
      description: 'Retrieve all the rivers in the database',
      notes: 'Retrieve all the rivers in the database',
      tags: ['api', 'rivers']
    }
  }
]
