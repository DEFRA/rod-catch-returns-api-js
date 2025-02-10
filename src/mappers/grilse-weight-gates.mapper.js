import { getBaseUrl } from '../utils/url-utils.js'

/**
 * Maps a GrilseWeightGate entity to a response object.
 *
 * @param {import('@hapi/hapi').Request} request - The Hapi request object
 * @param {import('../entities/index.js').Species} grilseWeightGate - The GrilseWeightGate entity
 * @returns {Object} - The mapped response object with HATEOAS links
 */
export function mapGrilseWeightGateToResponse(request, grilseWeightGate) {
  const { id, name, updatedAt, createdAt } = grilseWeightGate

  const baseUrl = getBaseUrl(request)
  const grilseWeightGateUrl = `${baseUrl}/api/grilseWeightGates/${id}`

  return {
    id,
    name,
    updatedAt,
    createdAt,
    _links: {
      self: {
        href: grilseWeightGateUrl
      },
      grilseWeightGate: {
        href: grilseWeightGateUrl
      },
      catchments: {
        href: `${grilseWeightGateUrl}/catchments`
      }
    }
  }
}
