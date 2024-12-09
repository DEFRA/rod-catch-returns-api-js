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
  const entity =
    _request?.route?.settings?.validate?.options?.entity || 'Unknown'

  const formattedErrors =
    err?.details?.map((detail) => {
      const detailPath = detail?.path?.length > 0 ? detail.path[0] : undefined
      const value =
        err._original && detailPath ? err._original[detailPath] : undefined

      return {
        entity,
        message: detail.message,
        property: detail?.context?.path || detailPath,
        value: detail?.context?.value || value
      }
    }) || err

  return h
    .response({ errors: formattedErrors })
    .code(StatusCodes.BAD_REQUEST)
    .takeover()
}
