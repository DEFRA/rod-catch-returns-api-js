import {
  extractDateFromISO,
  getMonthNameFromNumber,
  getMonthNumberFromName,
  isLeapYear
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

  describe('extractDateFromISO', () => {
    it('should extract the correct date from a valid ISO 8601 string with UTC offset in summer', () => {
      const isoDateTime = '2024-06-02T00:00:00+01:00'
      const result = extractDateFromISO(isoDateTime)
      expect(result).toBe('2024-06-02')
    })

    it('should extract the correct date from a valid ISO 8601 string with UTC offset in winter', () => {
      const isoDateTime = '2024-02-21T00:00:00+01:00'
      const result = extractDateFromISO(isoDateTime)
      expect(result).toBe('2024-02-21')
    })

    it('should extract the correct date from a valid ISO 8601 string in UTC', () => {
      const isoDateTime = '2024-03-21T00:00:00+00:00'
      const result = extractDateFromISO(isoDateTime)
      expect(result).toBe('2024-03-21')
    })

    it('should extract the correct date from a valid ISO 8601 string with a negative UTC offset', () => {
      const isoDateTime = '2024-12-25T15:00:00-05:00'
      const result = extractDateFromISO(isoDateTime)
      expect(result).toBe('2024-12-25')
    })

    it('should extract the correct date when the ISO string has milliseconds', () => {
      const isoDateTime = '2024-01-01T00:00:00.000Z'
      const result = extractDateFromISO(isoDateTime)
      expect(result).toBe('2024-01-01')
    })

    it('should throw an error if the input is not a valid ISO 8601 string', () => {
      const invalidDateTime = 'invalid-date-time'
      expect(() => extractDateFromISO(invalidDateTime)).toThrowError(
        'Invalid ISO 8601 date-time string'
      )
    })

    it('should handle edge cases like empty strings gracefully', () => {
      const emptyString = ''
      expect(() => extractDateFromISO(emptyString)).toThrowError(
        'Invalid ISO 8601 date-time string'
      )
    })

    it('should handle null input gracefully', () => {
      expect(() => extractDateFromISO(null)).toThrowError(
        'Invalid ISO 8601 date-time string'
      )
    })

    it('should handle undefined input gracefully', () => {
      expect(() => extractDateFromISO(undefined)).toThrowError(
        'Invalid ISO 8601 date-time string'
      )
    })
  })

  describe('isLeapYear', () => {
    it.each([2000, 2024, 2028, 2048, 2052, 2132, 2400])(
      'should return true if the year is a leap year',
      (year) => {
        expect(isLeapYear(year)).toBeTruthy()
      }
    )

    it.each([2026, 2027, 2100, 2133, 2399])(
      'should return false if the year is not a leap year',
      (year) => {
        expect(isLeapYear(year)).toBeFalsy()
      }
    )
  })
})
