import { StatusCodes } from 'http-status-codes'

/**
 * Handles Joi validation errors by formatting them into a consistent structure and returning
 * a bad request (400) response.
 *
 * @param {import('@hapi/hapi').Request} _request - The Hapi request object (unused).
 * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit.
 * @param {Object} err - The error object containing Joi validation error details.
 * @param {Array} err.details - An array of error details provided by Joi.
 * @param {string} err.details[].message - The error message for a specific validation issue.
 * @param {Array} err.details[].path - The path of the property that failed validation.
 * @param {Object} err._original - The original input that failed validation.
 * @returns {import('@hapi/hapi').ResponseObject} - A Hapi response object containing formatted error details.
 */

export const failAction = (_request, h, err) => {
  const errors = err.details.map((detail) => ({
    message: detail.message,
    property: detail.path[0],
    value: err._original[detail.path[0]]
  }))
  return h.response({ errors }).code(StatusCodes.BAD_REQUEST).takeover()
}
