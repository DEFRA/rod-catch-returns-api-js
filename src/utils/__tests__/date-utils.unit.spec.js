import {
  getMonthNameFromNumber,
  getMonthNumberFromName
} from '../date-utils.js'
describe('date-utils.unit', () => {
  describe('getMonthNumberFromName', () => {
    it('returns 1 for JANUARY', () => {
      expect(getMonthNumberFromName('JANUARY')).toBe(1)
    })

    it('returns 2 for FEBRUARY', () => {
      expect(getMonthNumberFromName('FEBRUARY')).toBe(2)
    })

    it('returns 12 for DECEMBER', () => {
      expect(getMonthNumberFromName('DECEMBER')).toBe(12)
    })

    it('returns 1 for january (lowercase)', () => {
      expect(getMonthNumberFromName('january')).toBe(1)
    })

    it('returns 2 for February (mixed case)', () => {
      expect(getMonthNumberFromName('February')).toBe(2)
    })

    it('returns 10 for OcTobeR (random case)', () => {
      expect(getMonthNumberFromName('OcTobeR')).toBe(10)
    })

    it('returns an error for NotAMonth', () => {
      expect(() => getMonthNumberFromName('NotAMonth')).toThrow(
        "Invalid month name: 'NotAMonth' is not a recognized month."
      )
    })

    it('returns an error for an empty string', () => {
      expect(() => getMonthNumberFromName('')).toThrow(
        'Invalid month name: monthName must be a non-empty string.'
      )
    })

    it('returns an error for null', () => {
      expect(() => getMonthNumberFromName(null)).toThrow(
        'Invalid month name: monthName must be a non-empty string.'
      )
    })

    it('returns an error for undefined', () => {
      expect(() => getMonthNumberFromName(undefined)).toThrow(
        'Invalid month name: monthName must be a non-empty string.'
      )
    })
  })
  describe('getMonthNameFromNumber', () => {
    it('returns JANUARY for 1', () => {
      expect(getMonthNameFromNumber(1)).toBe('JANUARY')
    })

    it('returns FEBRUARY for 2', () => {
      expect(getMonthNameFromNumber(2)).toBe('FEBRUARY')
    })

    it('returns DECEMBER for 12', () => {
      expect(getMonthNameFromNumber(12)).toBe('DECEMBER')
    })

    it('returns JULY for a string "7"', () => {
      expect(getMonthNameFromNumber('7')).toBe('JULY')
    })

    it('returns an error for 0', () => {
      expect(() => getMonthNameFromNumber(0)).toThrow(
        'Invalid month number: monthNumber must be an integer between 1 and 12.'
      )
    })

    it('returns an error for 13', () => {
      expect(() => getMonthNameFromNumber(13)).toThrow(
        'Invalid month number: monthNumber must be an integer between 1 and 12.'
      )
    })

    it('returns an error for 1.5', () => {
      expect(() => getMonthNameFromNumber(1.5)).toThrow(
        'Invalid month number: monthNumber must be an integer between 1 and 12.'
      )
    })

    it('returns an error for -1', () => {
      expect(() => getMonthNameFromNumber(-1)).toThrow(
        'Invalid month number: monthNumber must be an integer between 1 and 12.'
      )
    })

    it('returns an error for null', () => {
      expect(() => getMonthNameFromNumber(null)).toThrow(
        'Invalid month number: monthNumber must be an integer between 1 and 12.'
      )
    })

    it('returns an error for undefined', () => {
      expect(() => getMonthNameFromNumber(undefined)).toThrow(
        'Invalid month number: monthNumber must be an integer between 1 and 12.'
      )
    })
  })
})
