import { getBaseUrl } from '../url-utils.js'

describe('url-utils.unit', () => {
  describe('getBaseUrl', () => {
    const getRequestMock = (protocol = 'http', host = 'localhost:3000') => ({
      server: {
        info: {
          protocol
        }
      },
      info: {
        host
      }
    })

    it('should return the base URL with http protocol', () => {
      const request = getRequestMock('http', 'localhost:3000')
      const result = getBaseUrl(request)
      expect(result).toBe('http://localhost:3000')
    })

    it('should return the base URL with https protocol', () => {
      const request = getRequestMock('https', 'example.com')
      const result = getBaseUrl(request)
      expect(result).toBe('https://example.com')
    })

    it('should return the base URL with a custom host', () => {
      const request = getRequestMock('https', 'api.example.com')
      const result = getBaseUrl(request)
      expect(result).toBe('https://api.example.com')
    })

    it('should return the base URL with a localhost host', () => {
      const request = getRequestMock('http', 'localhost:8080')
      const result = getBaseUrl(request)
      expect(result).toBe('http://localhost:8080')
    })
  })
})
