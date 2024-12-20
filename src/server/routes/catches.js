import { Activity, Catch, Method, Species } from '../../entities/index.js'
import { catchIdSchema, createCatchSchema } from '../../schemas/catch.schema.js'
import { handleNotFound, handleServerError } from '../../utils/server-utils.js'
import {
  mapCatchToResponse,
  mapRequestToCatch
} from '../../mappers/catches.mapper.js'
import { StatusCodes } from 'http-status-codes'
import { mapActivityToResponse } from '../../mappers/activity.mapper.js'
import { mapMethodToResponse } from '../../mappers/methods.mapper.js'
import { mapSpeciesToResponse } from '../../mappers/species.mapper.js'

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
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link Catch}
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
          return handleServerError('Error creating catch', error, h)
        }
      },
      validate: {
        payload: createCatchSchema,
        options: { entity: 'Catch' }
      },
      description:
        'Create a catch (salmon and large sea trout) for an activity in the database',
      notes:
        'Create a catch (salmon and large sea trout) for an activity in the database',
      tags: ['api', 'catches']
    }
  },
  {
    method: 'GET',
    path: '/catches/{catchId}/activity',
    options: {
      /**
       * Retrieve the activity associated with a catch using the catch ID from the database
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       *     @param {string} request.params.catchId - The ID of the catch.
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link Activity}
       */
      handler: async (request, h) => {
        const catchId = request.params.catchId

        try {
          const catchWithActivity = await Catch.findOne({
            where: {
              id: catchId
            },
            include: [
              {
                model: Activity,
                required: true // Ensures the join will only return results if an associated Activity exists
              }
            ]
          })

          if (!catchWithActivity) {
            return handleNotFound(
              `Activity not found for catch with ID ${catchId}`,
              h
            )
          }

          const foundActivity = catchWithActivity.toJSON().Activity
          const response = mapActivityToResponse(request, foundActivity)

          return h.response(response).code(StatusCodes.OK)
        } catch (error) {
          return handleServerError(
            'Error fetching activity for catch',
            error,
            h
          )
        }
      },
      validate: {
        params: catchIdSchema
      },
      description: 'Retrieve the activity associated with a catch',
      notes:
        'Retrieve the activity associated with a catch using the catch ID from the database',
      tags: ['api', 'catches']
    }
  },
  {
    method: 'GET',
    path: '/catches/{catchId}/species',
    options: {
      /**
       * Retrieve the species associated with a catch using the catch ID from the database
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       *     @param {string} request.params.catchId - The ID of the catch.
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link Species}
       */
      handler: async (request, h) => {
        const catchId = request.params.catchId

        try {
          const catchWithSpecies = await Catch.findOne({
            where: {
              id: catchId
            },
            include: [
              {
                model: Species,
                required: true // Ensures the join will only return results if an associated Species exists
              }
            ]
          })

          if (!catchWithSpecies) {
            return handleNotFound(
              `Species not found for catch with ID ${catchId}`,
              h
            )
          }

          const foundSpecies = catchWithSpecies.toJSON().Species
          const response = mapSpeciesToResponse(request, foundSpecies)

          return h.response(response).code(StatusCodes.OK)
        } catch (error) {
          return handleServerError('Error fetching species for catch', error, h)
        }
      },
      validate: {
        params: catchIdSchema
      },
      description: 'Retrieve the species associated with a catch',
      notes:
        'Retrieve the species associated with a catch using the catch ID from the database',
      tags: ['api', 'catches']
    }
  },
  {
    method: 'GET',
    path: '/catches/{catchId}/method',
    options: {
      /**
       * Retrieve the fishing method associated with a catch using the catch ID from the database
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       *     @param {string} request.params.catchId - The ID of the catch.
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link Method}
       */
      handler: async (request, h) => {
        const catchId = request.params.catchId

        try {
          const catchWithMethod = await Catch.findOne({
            where: {
              id: catchId
            },
            include: [
              {
                model: Method,
                required: true // Ensures the join will only return results if an associated Method exists
              }
            ]
          })

          if (!catchWithMethod) {
            return handleNotFound(
              `Method not found for catch with ID ${catchId}`,
              h
            )
          }

          const foundMethod = catchWithMethod.toJSON().Method
          const response = mapMethodToResponse(request, foundMethod)

          return h.response(response).code(StatusCodes.OK)
        } catch (error) {
          return handleServerError('Error fetching method for catch', error, h)
        }
      },
      validate: {
        params: catchIdSchema
      },
      description: 'Retrieve the fishing method associated with a catch',
      notes:
        'Retrieve the fishing method associated with a catch using the catch ID from the database',
      tags: ['api', 'catches']
    }
  },
  {
    method: 'GET',
    path: '/catches/{catchId}',
    options: {
      /**
       * Retrieve a catch by its ID
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       *     @param {string} request.params.catchId - The catch id
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link Catch}
       */
      handler: async (request, h) => {
        try {
          const catchId = request.params.catchId
          const foundCatch = await Catch.findOne({
            where: { id: catchId }
          })

          if (!foundCatch) {
            return handleNotFound(`Catch not found for ID: ${catchId}`, h)
          }

          const mappedCatch = mapCatchToResponse(request, foundCatch.toJSON())

          return h.response(mappedCatch).code(StatusCodes.OK)
        } catch (error) {
          return handleServerError('Error fetching catch by ID', error, h)
        }
      },
      description: 'Retrieve a catch by its ID',
      notes: 'Retrieve a catch from the database by its ID',
      tags: ['api', 'catches']
    }
  }
]
