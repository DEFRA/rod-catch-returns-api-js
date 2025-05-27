import { GrilseWeightGate } from '../../entities/index.js'
import { StatusCodes } from 'http-status-codes'
import { handleServerError } from '../../utils/server-utils.js'
import { mapGrilseWeightGateToResponse } from '../../mappers/grilse-weight-gates.mapper.js'

export default [
  {
    method: 'GET',
    path: '/grilseWeightGates',
    options: {
      /**
       * Retrieve all the grilse weight gates in the database
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link GrilseWeightGate}
       */
      handler: async (request, h) => {
        try {
          const grilseWeightGates = await GrilseWeightGate.findAll()

          const mappedGrilseWeightGates = grilseWeightGates.map(
            (grilseWeightGate) =>
              mapGrilseWeightGateToResponse(grilseWeightGate)
          )

          return h
            .response({
              _embedded: {
                grilseWeightGates: mappedGrilseWeightGates
              }
            })
            .code(StatusCodes.OK)
        } catch (error) {
          return handleServerError(
            'Error fetching grilse weight gates',
            error,
            h
          )
        }
      },
      description: 'Retrieve all the grilse weight gates in the database',
      notes: 'Retrieve all the grilse weight gates in the database',
      tags: ['api', 'grilseWeightGates']
    }
  }
]
