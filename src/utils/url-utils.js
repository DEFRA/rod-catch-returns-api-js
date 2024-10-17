/**
 * Get the base url
 *
 * @param {import('@hapi/hapi').Request request - The Hapi request object
 * @returns {string} - the base url
 */
export const getBaseUrl = (request) =>
  `${request.server.info.protocol}://${request.info.host}`
