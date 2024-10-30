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
 *                      Returns 0 if the month name is invalid.
 */
export const getMonthNumberFromName = (monthName) =>
  months.indexOf(monthName.toUpperCase()) + 1

/**
 * Converts a month number to its corresponding month name.
 *
 * @param {number} monthNumber - The month number (1 for January, 2 for February, etc.).
 * @returns {string} - The name of the month (e.g., "JANUARY").
 *                     Returns undefined if the month number is out of range.
 */
export const getMonthNameFromNumber = (monthNumber) => months[monthNumber - 1]
