import { MASS_CONVERSION, MASS_SCALE } from './constants.js'

/**
 * Converts a mass value from ounces to kilograms.
 *
 * @param {number|string} massOz - The mass in ounces to be converted.
 * @returns {number} The converted mass in kilograms, rounded to a fixed number of decimal places defined by `MASS_SCALE`.
 */
export const convertOztoKg = (massOz) => {
  const parsedMass = parseFloat(massOz)
  if (isNaN(parsedMass)) {
    throw new Error('Mass in ounces must be a valid number')
  }

  return parseFloat((parsedMass * MASS_CONVERSION).toFixed(MASS_SCALE))
}

/**
 * Converts a mass value from kilograms to ounces.
 *
 * @param {number|string} massKg - The mass in kilograms to be converted.
 * @returns {number} The converted mass in ounces, rounded to a fixed number of decimal places defined by `MASS_SCALE`.
 */
export const convertKgtoOz = (massKg) => {
  const parsedMass = parseFloat(massKg)
  if (isNaN(parsedMass)) {
    throw new Error('Mass in kilograms must be a valid number')
  }

  return parseFloat((parsedMass / MASS_CONVERSION).toFixed(MASS_SCALE))
}
