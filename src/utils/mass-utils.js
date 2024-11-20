import { MASS_CONVERSION, MASS_SCALE } from './constants'

export const convertOztoKg = (massOz) =>
  parseFloat((massOz * MASS_CONVERSION).toFixed(MASS_SCALE))

export const convertKgtoOz = (massKg) =>
  parseFloat((massKg / MASS_CONVERSION).toFixed(MASS_SCALE))
