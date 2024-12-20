import { getBaseUrl } from '../utils/url-utils.js'

/**
 * Maps a River entity to a response object.
 *
 * @param {import('@hapi/hapi').Request} request - The Hapi request object
 * @param {import('../entities/index.js').River} activity - The Activity entity
 * @returns {Object} - The mapped response object with HATEOAS links
 */
export function mapRiverToResponse(request, river) {
  const { id, internal, name, version, updatedAt, createdAt } = river

  const baseUrl = getBaseUrl(request)
  const riverUrl = `${baseUrl}/api/rivers/${id}`

  return {
    id,
    internal,
    name,
    version,
    updatedAt,
    createdAt,
    _links: {
      self: {
        href: riverUrl
      },
      river: {
        href: riverUrl
      },
      catchment: {
        href: `${riverUrl}/catchment`
      }
    }
  }
}
