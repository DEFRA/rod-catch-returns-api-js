import { Activity, Catch, Method, Species } from '../../entities/index.js'
import {
  catchIdSchema,
  createCatchSchema,
  updateCatchActivityIdSchema,
  updateCatchSchema
} from '../../schemas/catch.schema.js'
import { handleNotFound, handleServerError } from '../../utils/server-utils.js'
import {
  mapCatchToResponse,
  mapRequestToCatch
} from '../../mappers/catches.mapper.js'
import { StatusCodes } from 'http-status-codes'
import { extractActivityId } from '../../utils/entity-utils.js'
import logger from '../../utils/logger-utils.js'
import { mapActivityToResponse } from '../../mappers/activities.mapper.js'
import { mapMethodToResponse } from '../../mappers/methods.mapper.js'
import { mapSpeciesToResponse } from '../../mappers/species.mapper.js'

const BASE_CATCHES_URL = '/catches/{catchId}'

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

          logger.info('Creating catch with details', catchData)

          const createdCatch = await Catch.create(catchData)

          const catchResponse = mapCatchToResponse(createdCatch.toJSON())

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
    path: `${BASE_CATCHES_URL}/activity`,
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
          const response = mapActivityToResponse(foundActivity)

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
    path: `${BASE_CATCHES_URL}/species`,
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
          const response = mapSpeciesToResponse(foundSpecies)

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
    path: `${BASE_CATCHES_URL}/method`,
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
          const response = mapMethodToResponse(foundMethod)

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
    path: BASE_CATCHES_URL,
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

          const mappedCatch = mapCatchToResponse(foundCatch.toJSON())

          return h.response(mappedCatch).code(StatusCodes.OK)
        } catch (error) {
          return handleServerError('Error fetching catch by ID', error, h)
        }
      },
      validate: {
        params: catchIdSchema
      },
      description: 'Retrieve a catch by its ID',
      notes: 'Retrieve a catch from the database by its ID',
      tags: ['api', 'catches']
    }
  },
  {
    method: 'DELETE',
    path: BASE_CATCHES_URL,
    options: {
      /**
       * Delete an catch by ID
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       *     @param {string} request.params.catchId - The catch id
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response indicating success or failure
       */
      handler: async (request, h) => {
        const catchId = request.params.catchId

        try {
          logger.info('Deleting catch with id:%s', catchId)
          const catchesDestroyed = await Catch.destroy({
            where: { id: catchId }
          })

          if (catchesDestroyed === 0) {
            return handleNotFound(`Catch not found for ID: ${catchId}`, h)
          }

          logger.info('Deleted catch with id:%s', catchId)
          return h.response().code(StatusCodes.NO_CONTENT)
        } catch (error) {
          return handleServerError('Error deleting catch', error, h)
        }
      },
      validate: {
        params: catchIdSchema
      },
      description: 'Delete a catch by ID',
      notes: 'Deletes a catch from the database by its ID',
      tags: ['api', 'catches']
    }
  },
  {
    method: 'PATCH',
    path: BASE_CATCHES_URL,
    options: {
      /**
       * Update a catch in the database using the catch ID
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       *     @param {string} request.params.catchId - The ID of the catch to update
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link Catch}
       */
      handler: async (request, h) => {
        const { catchId } = request.params
        const {
          dateCaught,
          species,
          mass,
          method,
          released,
          onlyMonthRecorded,
          noDateRecorded,
          reportingExclude
        } = request.payload

        try {
          const foundCatch = await Catch.findByPk(catchId)

          if (!foundCatch) {
            return handleNotFound(`Catch not found for ${catchId}`, h)
          }

          const catchData = mapRequestToCatch({
            dateCaught,
            species,
            mass,
            method,
            released,
            onlyMonthRecorded,
            noDateRecorded,
            reportingExclude
          })

          logger.info(`Updating catch ${catchId} with details`, catchData)

          // if a value is undefined, it is not updated by Sequelize
          const updatedCatch = await foundCatch.update(catchData)

          const mappedCatch = mapCatchToResponse(updatedCatch.toJSON())

          return h.response(mappedCatch).code(StatusCodes.OK)
        } catch (error) {
          return handleServerError('Error updating catch', error, h)
        }
      },
      validate: {
        params: catchIdSchema,
        payload: updateCatchSchema,
        options: { entity: 'Catch' }
      },
      description: 'Update a catch',
      notes: 'Update a catch',
      tags: ['api', 'catches']
    }
  },
  {
    method: 'PUT',
    path: `${BASE_CATCHES_URL}/activity`,
    options: {
      /**
       * Update the activity of catch in the database using the catch ID
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       *     @param {string} request.params.catchId - The ID of the catch to update
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link Catch}
       */
      handler: async (request, h) => {
        const { catchId } = request.params
        const activity = request.payload

        try {
          const foundCatch = await Catch.findByPk(catchId)

          if (!foundCatch) {
            return handleNotFound(`Catch not found for ${catchId}`, h)
          }

          const activityId = extractActivityId(activity)
          logger.info(
            `Updating catch ${catchId} with activity id=${activityId}`
          )

          const foundActivity = await Activity.findByPk(activityId)
          if (!foundActivity) {
            return handleNotFound(`Activity not found for catch:${catchId}`, h)
          }

          const updatedCatch = await foundCatch.update({
            activity_id: activityId
          })

          const mappedCatch = mapCatchToResponse(updatedCatch.toJSON())

          return h.response(mappedCatch).code(StatusCodes.OK)
        } catch (error) {
          return handleServerError(
            'Error updating catch for activity',
            error,
            h
          )
        }
      },
      validate: {
        params: catchIdSchema,
        payload: updateCatchActivityIdSchema,
        options: { entity: 'Catch' }
      },
      description: 'Update the activity id on a catch',
      notes: 'Update the activity id on catch',
      tags: ['api', 'catches']
    }
  }
]
