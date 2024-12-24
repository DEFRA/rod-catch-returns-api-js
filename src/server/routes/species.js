import { Species } from '../../entities/index.js'
import { StatusCodes } from 'http-status-codes'
import { handleServerError } from '../../utils/server-utils.js'
import { mapSpeciesToResponse } from '../../mappers/species.mapper.js'

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
      handler: async (request, h) => {
        try {
          const foundSpecies = await Species.findAll()

          const mappedSpecies = foundSpecies.map((species) =>
            mapSpeciesToResponse(request, species)
          )

          return h
            .response({
              _embedded: {
                species: mappedSpecies
              }
            })
            .code(StatusCodes.OK)
        } catch (error) {
          return handleServerError('Error fetching species', error, h)
        }
      },
      description: 'Retrieve all the species in the database',
      notes: 'Retrieve all the species in the database',
      tags: ['api', 'species']
    }
  }
]
