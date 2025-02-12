import { StatusCodes } from 'http-status-codes'
import { handleServerError } from '../../utils/server-utils.js'

export default [
  {
    method: 'POST',
    path: '/reporting/reference/grilse-probabilities/{season}/{gate}',
    options: {
      /**
       * Upload a grilse probabilities csv file to the database
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       *     @param {string} request.params.season - The year which the grilse probabilities file relates to
       *     @param {string} request.params.gate - The gate which the grilse probabilities file relates to
       *     @param {string} request.payload - The csv file
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing an empty body
       */
      handler: async (request, h) => {
        try {
          console.log(request.payload)
          return h.response([]).code(StatusCodes.OK)
        } catch (error) {
          return handleServerError(
            'Error uploading grilse probabilities file',
            error,
            h
          )
        }
      },
      description: 'Upload a grilse probabilities csv file to the database',
      notes: 'Upload a grilse probabilities csv file to the database',
      tags: ['api', 'reporting']
    }
  }
]
