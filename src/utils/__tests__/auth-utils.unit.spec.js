import { ROLES, isFMTOrAdmin } from '../auth-utils.js'

describe('auth-utils.unit', () => {
  describe('isFMTOrAdmin', () => {
    it.each([
      [true, ROLES.FMT],
      [true, ROLES.ADMIN],
      [false, null],
      [false, undefined],
      [false, 'unknown']
    ])('should return %s if role is %s', (result, role) => {
      expect(result).toBe(isFMTOrAdmin(role))
    })
  })
})
