import { getBaseUrl } from '../utils/url-utils.js'

/**
 * Maps a Submission entity to a response object.
 *
 * @param {import('@hapi/hapi').Request} request - The Hapi request object
 * @param {import('../entities/index.js').Method} method - The Method entity
 * @returns {Object} - The mapped response object with HATEOAS links
 */
export function mapMethodToResponse(request, method) {
  const baseUrl = getBaseUrl(request)
  return {
    ...method,
    _links: {
      self: {
        href: `${baseUrl}/api/methods/${method.id}`
      },
      method: {
        href: `${baseUrl}/api/methods/${method.id}`
      }
    }
  }
}
