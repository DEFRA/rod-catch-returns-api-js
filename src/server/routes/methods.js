import { Method } from '../../entities/index.js'
import { StatusCodes } from 'http-status-codes'
import logger from '../../utils/logger-utils.js'
import { mapMethodToResponse } from '../../mappers/methods.mapper.js'

export default [
  {
    method: 'GET',
    path: '/methods',
    options: {
      /**
       * Retrieve all fishing methods in the database
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link Method}
       */
      handler: async (request, h) => {
        try {
          const methods = await Method.findAll()

          const mappedMethods = methods.map((method) =>
            mapMethodToResponse(request, method.toJSON())
          )

          return h
            .response({
              _embedded: {
                methods: mappedMethods
              }
            })
            .code(StatusCodes.OK)
        } catch (error) {
          logger.error('Error fetching methods:', error)
          return h
            .response({ error: 'Unable to fetch methods' })
            .code(StatusCodes.INTERNAL_SERVER_ERROR)
        }
      },
      description: 'Retrieve all the fishing methods in the database',
      notes: 'Retrieve all the fishing methods in the database',
      tags: ['api', 'methods']
    }
  },
  {
    method: 'GET',
    path: '/methods/{methodId}',
    options: {
      /**
       * Retreive a fishing method by ID from the database
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link Method}
       */
      handler: async (request, h) => {
        try {
          const methodId = request.params.methodId
          const method = await Method.findOne({ where: { id: methodId } })

          if (!method) {
            logger.error(`method not found for id ${methodId}`)
            return h.response().code(StatusCodes.NOT_FOUND)
          }

          const mappedMethod = mapMethodToResponse(request, method.toJSON())

          return h.response(mappedMethod).code(StatusCodes.OK)
        } catch (error) {
          logger.error('Error fetching method:', error)
          return h
            .response({ error: 'Unable to fetch method' })
            .code(StatusCodes.INTERNAL_SERVER_ERROR)
        }
      },
      description: 'Retreive a fishing method by ID from the database',
      notes: 'Retreive a fishing method by ID from the database',
      tags: ['api', 'methods']
    }
  }
]
