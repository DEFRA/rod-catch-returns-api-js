import {
  deleteGrilseProbabilitiesForSeasonAndGate,
  isGrilseProbabilityExistsForSeasonAndGate
} from '../../services/grilse-probabilities.service.js'
import { GrilseProbability } from '../../entities/index.js'
import { StatusCodes } from 'http-status-codes'
import { getMonthNumberFromName } from '../../utils/date-utils.js'
import { handleServerError } from '../../utils/server-utils.js'
import { parse } from 'csv-parse'

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
          const overwrite = request.query.overwrite === 'true'
          const csvData = request.payload.toString()

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

          const records = await new Promise((resolve, reject) => {
            parse(
              csvData,
              { columns: true, skip_empty_lines: true },
              (err, output) => {
                if (err) reject(err)
                else resolve(output)
              }
            )
          })

          /**
           * Array to store valid GrilseProbability records before bulk inserting.
           * Each entry represents a probability associated with a specific month, mass, and gate.
           *
           * @type {Array<{ season: number, gate_id: number, month: number, massInPounds: number, probability: number, version: Date }>}
           */
          const grilseProbabilities = []
          for (const record of records) {
            const { Weight, ...months } = record
            const massInPounds = Number(Weight)

            Object.entries(months).forEach(([monthName, probability]) => {
              const probabilityValue = Number(probability)
              if (probabilityValue > 0) {
                grilseProbabilities.push({
                  season: Number(season),
                  gate_id: Number(gate),
                  month: getMonthNumberFromName(monthName),
                  massInPounds,
                  probability: probabilityValue,
                  version: new Date()
                })
              }
            })
          }

          // Bulk insert records if there are valid probabilities
          if (grilseProbabilities.length > 0) {
            await GrilseProbability.bulkCreate(grilseProbabilities)
          }

          return h.response([]).code(StatusCodes.CREATED)
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
