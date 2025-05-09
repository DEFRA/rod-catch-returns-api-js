import { GrilseProbability, GrilseWeightGate } from '../entities/index.js'
import { MONTH_NAMES, getMonthNumberFromName } from '../utils/date-utils.js'
import { GrilseValidationError } from '../models/grilse-validation-error.model.js'
import { Op } from 'sequelize'
import { StatusCodes } from 'http-status-codes'
import { parse } from 'csv-parse'
import { promisify } from 'util'

const parseAsync = promisify(parse)

/**
 * Get the grilse probabilities for a given season range.
 *
 * @param {number} startSeason - The start of the season range (e.g., 2023).
 * @param {number} endSeason - The end of the season range (e.g., 2025).
 * @returns {Promise<Array<GrilseProbability>>} - Resolves to an array of GrilseProbability
 */
export const getGrilseProbabilitiesBySeasonRange = async (
  startSeason,
  endSeason
) => {
  if (!startSeason || !endSeason || startSeason > endSeason) {
    throw new Error(
      'Invalid season range. Ensure startSeason is less than or equal to endSeason.'
    )
  }

  return GrilseProbability.findAll({
    where: {
      season: {
        [Op.between]: [startSeason, endSeason]
      }
    },
    include: {
      model: GrilseWeightGate,
      required: true
    },
    order: [
      ['season', 'DESC'], // Sort by season, highest first
      ['month', 'ASC'], // Sort by month, lowest first
      ['massInPounds', 'ASC'] // Sort by mass, lowest first
    ]
  })
}

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

      // Only add a grilse probability value if the probability is greater than zero (reporting assumes 0 for any missing data point)
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
    trim: true,
    relax_column_count: true // don't error if there are inconsistent columns count, we handle this by throwing ROW_HEADER_DISCREPANCY
  })

  const [headers, ...rows] = records

  validateHeaders(headers)
  validateRows(headers, rows)

  return records
}

/**
 * Validates the headers of the CSV file.
 *
 * @param {Array<string>} headers - The headers of the CSV file as an array of strings.
 * @throws {GrilseValidationError} If there are validation errors with the headers.
 */
export const validateHeaders = (headers) => {
  const errors = []

  // first header should always be Weight
  if (headers[0].toUpperCase() !== 'WEIGHT') {
    errors.push({ errorType: 'MISSING_WEIGHT_HEADER', row: 1, col: 1 })
  }

  const visitedMonthHeaders = new Set()
  for (let i = 1; i < headers.length; i++) {
    const headerKey = headers[i].toUpperCase()

    // check if all headers contain the correct month names
    if (!MONTH_NAMES.includes(headerKey)) {
      errors.push({ errorType: 'COLUMN_DISALLOWED', row: 1, col: i + 1 })
    }

    // check if there any months have been more than once
    if (visitedMonthHeaders.has(headerKey)) {
      errors.push({ errorType: 'DUPLICATE_HEADERS', row: 1, col: i + 1 })
    } else {
      visitedMonthHeaders.add(headerKey)
    }
  }

  // check if there are any valid months in the header
  if (visitedMonthHeaders.size === 0) {
    errors.push({
      errorType: 'MISSING_MONTH_HEADER',
      row: 1,
      col: headers.length
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

export const validateRows = (headers, rows) => {
  const errors = []
  const weightsProcessed = new Set()

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowIndex = i + 2 // we are not looping through the headers so it is +2

    if (headers.length !== row.length) {
      const col = Math.min(headers.length, row.length) + 1
      errors.push({
        errorType: 'ROW_HEADER_DISCREPANCY',
        row: rowIndex,
        col
      })
    }

    // Extract the weight (in lbs) that this row of data belongs to and check that it isn't duplicated from a previously processed row
    const weightField = Number(row[0])
    if (!Number.isInteger(weightField)) {
      errors.push({
        errorType: 'NOT_WHOLE_NUMBER',
        row: rowIndex,
        col: 1
      })
    } else {
      const weightValue = weightField
      if (weightsProcessed.has(weightValue)) {
        errors.push({ errorType: 'DUPLICATE_WEIGHT', row: rowIndex, col: 1 })
      } else {
        weightsProcessed.add(weightValue)
      }
    }

    // For each month column that was discovered, check the probability is between 0 and 1
    for (let j = 1; j < row.length; j++) {
      const probability = Number(row[j])
      if (probability < 0 || probability > 1) {
        errors.push({
          errorType: 'INVALID_PROBABILITY',
          row: rowIndex,
          col: j + 1
        })
      }
    }
  }

  if (errors.length > 0) {
    throw new GrilseValidationError({
      status: StatusCodes.BAD_REQUEST,
      message: '400 BAD_REQUEST "Invalid CSV data"',
      errors
    })
  }
}

/**
 * Generates a CSV string from grilse probabilities and associated weight gates.
 *
 * @param {Array<GrilseProbability} grilseProbabilities - An array of grilse probability objects with associated weight gates.
 * @returns {string} - A CSV string representing the grilse probabilities.
 */
export const generateCsvFromGrilseProbabilities = (grilseProbabilities) => {
  const header = 'Season,Gate,Month,Mass (lbs),Probability'

  const rows = grilseProbabilities.map((grilseProbability) => {
    const foundGrilseWeightGate = grilseProbability?.GrilseWeightGate
    return `${grilseProbability.season},${foundGrilseWeightGate ? foundGrilseWeightGate?.name : 'Unknown'},${grilseProbability.month},${grilseProbability.massInPounds},${grilseProbability.probability}`
  })

  return [header, ...rows].join('\n')
}
