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

    it('returns 0 for NotAMonth', () => {
      expect(getMonthNumberFromName('NotAMonth')).toBe(0)
    })

    it('returns 0 for an empty string', () => {
      expect(getMonthNumberFromName('')).toBe(0)
    })

    it('returns 0 for null', () => {
      expect(getMonthNumberFromName(null)).toBe(0)
    })

    it('returns 0 for undefined', () => {
      expect(getMonthNumberFromName(undefined)).toBe(0)
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

    it('returns undefined for 0', () => {
      expect(getMonthNameFromNumber(0)).toBeUndefined()
    })

    it('returns undefined for 13', () => {
      expect(getMonthNameFromNumber(13)).toBeUndefined()
    })

    it('returns undefined for -1', () => {
      expect(getMonthNameFromNumber(-1)).toBeUndefined()
    })

    it('returns undefined for null', () => {
      expect(getMonthNameFromNumber(null)).toBeUndefined()
    })

    it('returns undefined for undefined', () => {
      expect(getMonthNameFromNumber(undefined)).toBeUndefined()
    })
  })
})
