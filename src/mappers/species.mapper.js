import { getBaseUrl } from '../utils/url-utils.js'

/**
 * Maps a Species entity to a response object.
 *
 * @param {import('@hapi/hapi').Request} request - The Hapi request object
 * @param {import('../entities/index.js').Species} species - The Species entity
 * @returns {Object} - The mapped response object with HATEOAS links
 */
export function mapSpeciesToResponse(request, species) {
  const { id, name, smallCatchMass, updatedAt, createdAt } = species

  const baseUrl = getBaseUrl(request)
  const speciesUrl = `${baseUrl}/api/species/${id}`

  return {
    id,
    name,
    smallCatchMass: parseFloat(smallCatchMass),
    updatedAt,
    createdAt,
    _links: {
      self: {
        href: speciesUrl
      },
      species: {
        href: speciesUrl
      }
    }
  }
}
