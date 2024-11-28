import { handleNotFound, handleServerError } from '../server-utils.js'
import { getMockResponseToolkit } from '../../test-utils/server-test-utils.js'
import logger from '../logger-utils.js'

jest.mock('../logger-utils.js')

describe('logger-utils.unit', () => {
  describe('handleNotFound', () => {
    it('should log the message', () => {
      const loggerMessage = 'Resource not found'
      const h = getMockResponseToolkit()

      handleNotFound(loggerMessage, h)

      expect(logger.error).toHaveBeenCalledWith(loggerMessage)
    })

    it('should return a 404 response and empty body', () => {
      const loggerMessage = 'Resource not found'
      const h = getMockResponseToolkit()

      const result = handleNotFound(loggerMessage, h)

      expect(result.payload).toBeUndefined()
      expect(result.statusCode).toBe(404)
    })
  })

  describe('handleServerError', () => {
    it('should log the message', () => {
      const loggerMessage = 'Server error'
      const error = new Error('Database error')
      const h = getMockResponseToolkit()

      handleServerError(loggerMessage, error, h)

      expect(logger.error).toHaveBeenCalledWith(loggerMessage, error)
    })

    it('should return a 500 response and the error', () => {
      const loggerMessage = 'Server error'
      const error = new Error('Database error')
      const h = getMockResponseToolkit()

      const result = handleServerError(loggerMessage, error, h)

      expect(result.payload).toStrictEqual({
        error: 'Server error'
      })
      expect(result.statusCode).toBe(500)
    })
  })
})
