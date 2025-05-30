/**
 * Get the base url
 *
 * @param {import('@hapi/hapi').Request request - The Hapi request object
 * @returns {string} - the base url
 */
export const getBaseUrl = () => process.env.BASE_URL
