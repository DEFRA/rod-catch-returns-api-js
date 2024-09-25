import debug from 'debug'
import logger from '../logger-utils.js'

jest.mock('debug', () =>
  jest.fn(() => ({
    color: null
  }))
)

describe('logger-utils.unit', () => {
  it('should create an info logger with the correct namespace and color', () => {
    expect(debug).toHaveBeenCalledWith('rcr-api:info')

    expect(logger.info.color).toBe(2)
  })

  it('should create an error logger with the correct namespace and color', () => {
    expect(debug).toHaveBeenCalledWith('rcr-api:error')

    expect(logger.error.color).toBe(1)
  })
})
