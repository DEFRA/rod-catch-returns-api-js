import { GrilseProbability } from '../entities/index.js'
import { GrilseValidationError } from '../models/grilse-probability.model.js'
import { StatusCodes } from 'http-status-codes'
import { getMonthNumberFromName } from '../utils/date-utils.js'
import { parse } from 'csv-parse'

/**
 * Checks if grilse probabilities exist for a given season and gate.
 *
 * @param {number} season - The season (year) to check for probabilities.
 * @param {number} gate - The gate ID to check for probabilities.
 * @returns {Promise<boolean>} - Resolves to `true` if probabilities exist, otherwise `false`.
 */
export const isGrilseProbabilityExistsForSeasonAndGate = async (
  season,
  gate
) => {
  const count = await GrilseProbability.count({
    where: {
      season,
      gate_id: gate
    }
  })

  return count > 0
}

/**
 * Deletes all grilse probabilities for a given season and gate.
 *
 * @param {number} season - The season (year) for which probabilities should be deleted.
 * @param {number} gate - The gate ID for which probabilities should be deleted.
 * @returns {Promise<number>} - Resolves to the number of deleted records.
 */

export const deleteGrilseProbabilitiesForSeasonAndGate = (season, gate) => {
  return GrilseProbability.destroy({
    where: {
      season,
      gate_id: gate
    }
  })
}

/**
 * Parses a CSV string containing grilse probability data into an array of objects.
 *
 * @param {string} csvData - The CSV data as a string.
 * @returns {Promise<Object[]>} A promise that resolves to an array of objects,
 * each representing a row from the CSV with column headers as keys.
 * @throws {Error} If there is an error while parsing the CSV.
 */
export const parseGrilseProbabilitiesCsv = async (csvData) => {
  const records = await new Promise((resolve, reject) => {
    parse(csvData, { columns: true, skip_empty_lines: true }, (err, output) => {
      if (err) {
        reject(err)
      } else {
        resolve(output)
      }
    })
  })

  return records
}

/**
 * Processes grilse probability records from parsed CSV data.
 * Converts mass and probability values, maps month names to numeric values,
 * and filters out records where probability is 0 or less.
 *
 * @param {Array<Object>} records - The parsed CSV data, where each object represents a row.
 * @param {number} season - The season associated with the probabilities.
 * @param {number} gate - The gate ID associated with the probabilities.
 * @returns {Array<{ season: number, gate_id: number, month: number, massInPounds: number, probability: number, version: Date }>}
 * An array of valid GrilseProbability records ready for database insertion.
 */
export const processGrilseProbabilities = (records, season, gate) => {
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
  return grilseProbabilities
}

/**
 * Validates the uploaded CSV file.
 *
 * @param {string|Buffer} file - The CSV file as a buffer or string
 * @returns {null} If there are no errors
 * @throws {Error} If the file is empty or not a valid CSV.
 */
export const validateCsvFile = (file) => {
  if (!(typeof file === 'string' || Buffer.isBuffer(file))) {
    throw new GrilseValidationError({
      status: StatusCodes.UNPROCESSABLE_ENTITY,
      message: 'File is empty or not a valid csv.',
      error: 'Unprocessable Entity'
    })
  }

  const csvData = Buffer.isBuffer(file) ? file.toString('utf-8') : file.trim()

  if (!csvData) {
    throw new GrilseValidationError({
      status: StatusCodes.UNPROCESSABLE_ENTITY,
      message: 'File is empty or not a valid csv.',
      error: 'Unprocessable Entity'
    })
  }

  return null
}
