const months = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER'
]
/**
 * Converts a month name to its corresponding month number.
 *
 * @param {string} monthName - The name of the month (e.g., "JANUARY").
 * @returns {number} - The month number (1 for January, 2 for February, etc.).
 * @throws {Error} - Throws an error if monthName is undefined, null, or not a valid month name.
 */
export const getMonthNumberFromName = (monthName) => {
  if (!monthName || typeof monthName !== 'string') {
    throw new Error('Invalid month name: monthName must be a non-empty string.')
  }

  const monthNumber = months.indexOf(monthName.toUpperCase()) + 1

  if (monthNumber === 0) {
    throw new Error(
      `Invalid month name: '${monthName}' is not a recognized month.`
    )
  }

  return monthNumber
}

/**
 * Converts a month number (or numeric string) to its corresponding month name.
 *
 * @param {number|string} monthNumber - The month number (1 for January, 2 for February, etc.) or a numeric string.
 * @returns {string} - The name of the month (e.g., "JANUARY").
 * @throws {Error} - Throws an error if monthNumber is not a valid number between 1 and 12.
 */
export const getMonthNameFromNumber = (monthNumber) => {
  const parsedMonthNumber = Number(monthNumber)

  if (
    !Number.isInteger(parsedMonthNumber) ||
    parsedMonthNumber < 1 ||
    parsedMonthNumber > 12
  ) {
    throw new Error(
      'Invalid month number: monthNumber must be an integer between 1 and 12.'
    )
  }

  return months[parsedMonthNumber - 1]
}

/**
 * Extracts the date portion (YYYY-MM-DD) from an ISO 8601 date-time string
 *
 * @param {string} isoDateTime - The ISO 8601 date-time string to extract the date from, e.g. 2024-08-02T00:00:00+01:00
 * @returns {string} - The extracted date in YYYY-MM-DD format
 * @throws {Error} - If the input is not a valid ISO 8601 date-time string
 */
export const extractDateFromISO = (isoDateTime) => {
  if (
    !isoDateTime ||
    typeof isoDateTime !== 'string' ||
    !isoDateTime.includes('T')
  ) {
    throw new Error('Invalid ISO 8601 date-time string')
  }
  return isoDateTime.split('T')[0]
}
