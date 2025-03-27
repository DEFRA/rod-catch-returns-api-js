import { StatusCodes } from 'http-status-codes'
import { handleServerError } from '../../utils/server-utils.js'

export default [
  {
    method: 'GET',
    path: '/profile',
    options: {
      /**
       * Retrieve a list of all the urls available
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response
       */
      handler: async (request, h) => {
        try {
          const urls = request.server.table().map((route) => ({
            method: route.method.toUpperCase(),
            path: route.path
          }))
          return h
            .response({
              urls
            })
            .code(StatusCodes.OK)
        } catch (error) {
          return handleServerError('Error fetching profile', error, h)
        }
      },
      description: 'Retrieve a list of all the urls available',
      notes: 'Retrieve a list of all the urls available',
      tags: ['api', 'profile']
    }
  }
]
