import { StatusCodes } from 'http-status-codes'

export class GrilseValidationError extends Error {
  /**
   * @param {Object} options - Error details
   * @param {number} options.status - HTTP status code
   * @param {string} options.message - Error message
   * @param {Array<object>} [options.errors] - Detailed validation errors array
   * @param {string} [options.error] - Detailed validation error string
   */
  constructor({
    status = StatusCodes.BAD_REQUEST,
    message = 'Validation error',
    errors,
    error
  } = {}) {
    super(message)
    this.name = 'GrilseValidationError'
    this.status = status
    this.errors = errors
    this.error = error
  }
}
