import { getBaseUrl } from '../url-utils.js'

describe('url-utils.unit', () => {
  describe('getBaseUrl', () => {
    const originalEnv = process.env

    beforeEach(() => {
      jest.resetModules()
      process.env = {
        ...originalEnv
      }
    })

    it('should return the base URL', () => {
      process.env.BASE_URL = 'http://localhost:5000'
      const result = getBaseUrl()
      expect(result).toBe('http://localhost:5000')
    })
  })
})
