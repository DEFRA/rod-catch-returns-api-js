import {
  deleteGrilseProbabilitiesForSeasonAndGate,
  isGrilseProbabilityExistsForSeasonAndGate,
  processGrilseProbabilities,
  validateAndParseCsvFile
} from '../../services/grilse-probabilities.service.js'
import {
  grilseProbabilityRequestParamSchema,
  grilseProbabilityRequestQuerySchema
} from '../../schemas/grilse-probabilities.schema.js'
import { GrilseProbability } from '../../entities/index.js'
import { GrilseValidationError } from '../../models/grilse-probability.model.js'
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
       *     @param {boolean} request.query.overwrite - A boolean to say whether the grilse probabilities for the specified season and gate should be overridden
       *     @param {string} request.payload - The csv file
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing an empty body
       */
      handler: async (request, h) => {
        try {
          const { season, gate } = request.params
          const { overwrite } = request.query

          const records = await validateAndParseCsvFile(request.payload)

          const exists = await isGrilseProbabilityExistsForSeasonAndGate(
            season,
            gate
          )

          if (exists) {
            if (!overwrite) {
              return h
                .response({
                  message:
                    'Existing data found for the given season and gate but overwrite parameter not set'
                })
                .code(StatusCodes.CONFLICT)
            }
            await deleteGrilseProbabilitiesForSeasonAndGate(season, gate)
          }

          const grilseProbabilities = processGrilseProbabilities(
            records,
            season,
            gate
          )

          // Bulk insert records if there are valid probabilities
          if (grilseProbabilities.length > 0) {
            await GrilseProbability.bulkCreate(grilseProbabilities)
          }

          return h.response().code(StatusCodes.CREATED)
        } catch (error) {
          if (error instanceof GrilseValidationError) {
            return h
              .response({
                timestamp: new Date().toISOString(),
                status: error.status,
                message: error.message,
                path: request.path,
                ...(error.error && { error: error.error }),
                ...(error.errors && { errors: error.errors })
              })
              .code(error.status)
          }
          return handleServerError(
            'Error uploading grilse probabilities file',
            error,
            h
          )
        }
      },
      validate: {
        params: grilseProbabilityRequestParamSchema,
        query: grilseProbabilityRequestQuerySchema
      },
      description: 'Upload a grilse probabilities csv file to the database',
      notes: 'Upload a grilse probabilities csv file to the database',
      tags: ['api', 'reporting']
    }
  }
]
