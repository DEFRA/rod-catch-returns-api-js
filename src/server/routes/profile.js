import { StatusCodes } from 'http-status-codes'
import { handleServerError } from '../../utils/server-utils.js'

export default [
  {
    method: 'GET',
    path: '/profile',
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
          return h.response([]).code(StatusCodes.OK)
        } catch (error) {
          return handleServerError('Error fetching profile', error, h)
        }
      },
      description: 'Retrieve a profile',
      notes: 'Retrieve a profile',
      tags: ['api', 'profile']
    }
  }
]
