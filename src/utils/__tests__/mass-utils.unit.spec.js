import { convertKgtoOz, convertOztoKg } from '../mass-utils.js'

describe('mass-utils.unit', () => {
  describe('convertOztoKg', () => {
    it('converts 16 ounces to 0.453592 kilograms', () => {
      expect(convertOztoKg(16)).toBe(0.453592)
    })

    it('converts 0 ounces to 0 kilograms', () => {
      expect(convertOztoKg(0)).toBe(0)
    })

    it('converts 35.27 ounces to 0.999888 kilograms', () => {
      expect(convertOztoKg(35.27)).toBe(0.999888)
    })

    it('converts 10.5 ounces to 0.29767 kilograms', () => {
      expect(convertOztoKg(10.5)).toBe(0.29767)
    })

    it('converts -6 ounces (negative numbers) to -0.170097 kilograms', () => {
      expect(convertOztoKg(-6)).toBe(-0.170097)
    })

    it('converts "5" ounces (string) to -0.170097 kilograms', () => {
      expect(convertOztoKg('5')).toBe(0.141748)
    })

    it('throws an error for null input', () => {
      expect(() => convertOztoKg(null)).toThrow(
        'Mass in ounces must be a valid number'
      )
    })

    it('throws an error for undefined input', () => {
      expect(() => convertOztoKg(undefined)).toThrow(
        'Mass in ounces must be a valid number'
      )
    })

    it('throws an error for invalid string input', () => {
      expect(() => convertOztoKg('invalid')).toThrow(
        'Mass in ounces must be a valid number'
      )
    })
  })

  describe('convertKgtoOz', () => {
    it('converts 1 kilogram to 35.273962 ounces', () => {
      expect(convertKgtoOz(1)).toBe(35.273962)
    })

    it('converts 0 kilograms to 0 ounces', () => {
      expect(convertKgtoOz(0)).toBe(0)
    })

    it('converts 0.4536 kilograms to 16.000269 ounces', () => {
      expect(convertKgtoOz(0.4536)).toBe(16.000269)
    })

    it('converts 2.5 kilograms to 88.184905ounces', () => {
      expect(convertKgtoOz(2.5)).toBe(88.184905)
    })

    it('converts -1 kilograms (negative numbers) to -35.273962 ounces', () => {
      expect(convertKgtoOz(-1)).toBe(-35.273962)
    })

    it('converts "3" kilograms (string) to 105.821886 ounces', () => {
      expect(convertKgtoOz('3')).toBe(105.821886)
    })

    it('throws an error for null input', () => {
      expect(() => convertKgtoOz(null)).toThrow(
        'Mass in kilograms must be a valid number'
      )
    })

    it('throws an error for undefined input', () => {
      expect(() => convertKgtoOz(undefined)).toThrow(
        'Mass in kilograms must be a valid number'
      )
    })

    it('throws an error for invalid string input', () => {
      expect(() => convertKgtoOz('invalid')).toThrow(
        'Mass in kilograms must be a valid number'
      )
    })
  })
})
