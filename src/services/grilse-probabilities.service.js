import { MONTH_NAMES, getMonthNumberFromName } from '../utils/date-utils.js'
import { GrilseProbability } from '../entities/index.js'
import { GrilseValidationError } from '../models/grilse-probability.model.js'
import { StatusCodes } from 'http-status-codes'
import { parse } from 'csv-parse'
import { promisify } from 'util'

const parseAsync = promisify(parse)

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
 * Processes grilse probability records from parsed CSV data.
 * Converts mass and probability values, maps month names to numeric values,
 * and filters out records where probability is 0 or less.
 *
 * @param {Array<Array<string>>} csvData - The parsed CSV data, where each sub-array represents a row.
 * @param {number} season - The season associated with the probabilities.
 * @param {number} gate - The gate ID associated with the probabilities.
 * @returns {Array<{ season: number, gate_id: number, month: number, massInPounds: number, probability: number, version: Date }>}
 * An array of valid GrilseProbability records ready for database insertion.
 */
export const processGrilseProbabilities = (csvData, season, gate) => {
  if (!Array.isArray(csvData)) {
    throw new Error('Invalid CSV data: input must be an array')
  }

  const [headers, ...rows] = csvData

  const grilseProbabilities = []

  for (const row of rows) {
    const massInPounds = Number(row[0])

    for (let i = 1; i < row.length; i++) {
      const monthName = headers[i]
      const probabilityValue = Number(row[i])

      if (!isNaN(probabilityValue) && probabilityValue > 0) {
        grilseProbabilities.push({
          season: Number(season),
          gate_id: Number(gate),
          month: getMonthNumberFromName(monthName),
          massInPounds,
          probability: probabilityValue,
          version: new Date()
        })
      }
    }
  }

  return grilseProbabilities
}

/**
 * Validates the uploaded CSV file.
 *
 * @param {string|Buffer} file - The CSV file as a buffer or string
 * @returns {Promise<Array<Array<string>>>} A promise that resolves to a 2D array of parsed CSV data.
 * @throws {GrilseValidationError} If the file is empty, not a valid CSV, or contains validation errors.
 *
 * @example
 * // Example of a successful return value:
 * [
 *   ["Weight", "June", "July", "August", "July"],
 *   ["1", "1.0", "1.0", "1.0", "1.0"],
 *   ["2", "1.0", "1.0", "1.0", "1.0"]
 * ]
 */
export const validateAndParseCsvFile = async (file) => {
  const fileEmptyErrorDetails = {
    status: StatusCodes.UNPROCESSABLE_ENTITY,
    message: 'File is empty or not a valid csv.',
    error: 'Unprocessable Entity'
  }

  if (!(typeof file === 'string' || Buffer.isBuffer(file))) {
    throw new GrilseValidationError(fileEmptyErrorDetails)
  }

  const csvData = Buffer.isBuffer(file) ? file.toString('utf-8') : file.trim()
  if (!csvData) {
    throw new GrilseValidationError(fileEmptyErrorDetails)
  }

  const records = await parseAsync(csvData, {
    skip_empty_lines: true,
    trim: true
  })

  const headers = records[0]

  validateHeaders(headers)

  return records
}

/**
 * @param {Array<string>} headers - The headers of the CSV file as an array of strings.
 * @throws {GrilseValidationError} If there are validation errors with the headers.
 */
export const validateHeaders = (headers) => {
  const errors = []

  // first header should always be Weight
  if (headers[0].toUpperCase() !== 'WEIGHT') {
    errors.push({ errorType: 'MISSING_WEIGHT_HEADER', row: 1, column: 1 })
  }

  const visitedMonthHeaders = new Set()
  for (let i = 1; i < headers.length; i++) {
    const headerKey = headers[i].toUpperCase()

    // check if all headers contain the correct month names
    if (!MONTH_NAMES.includes(headerKey)) {
      errors.push({ errorType: 'COLUMN_DISALLOWED', row: 1, column: i + 1 })
    }

    // check if there any months have been more than once
    if (visitedMonthHeaders.has(headerKey)) {
      errors.push({ errorType: 'DUPLICATE_HEADERS', row: 1, column: i + 1 })
    } else {
      visitedMonthHeaders.add(headerKey)
    }
  }

  // check if there are any valid months in the header
  if (visitedMonthHeaders.size === 0) {
    errors.push({
      errorType: 'MISSING_MONTH_HEADER',
      row: 1,
      column: headers.length
    })
  }

  if (errors.length > 0) {
    throw new GrilseValidationError({
      status: StatusCodes.BAD_REQUEST,
      message: '400 BAD_REQUEST "Invalid CSV data"',
      errors
    })
  }
}
