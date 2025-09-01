import { getBaseUrl } from '../utils/url-utils.js'

/**
 * Maps a Grilse Probability entity to a response object.
 *
 * @param {import('../entities/index.js').GrilseProbability} grilseProbability - The Grilse GrilseProbabilityProbability entity
 * @returns {Object} - The mapped response object with HATEOAS links
 */
export function mapGrilseProbabilityToResponse(species) {
  const { id, name, smallCatchMass, updatedAt, createdAt } = species

  const baseUrl = getBaseUrl()
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
