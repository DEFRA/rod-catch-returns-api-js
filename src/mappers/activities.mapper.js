import { getBaseUrl } from '../utils/url-utils.js'

/**
 * Maps a Activity entity to a response object.
 *
 * @param {import('../entities/index.js').Activity} activity - The Activity entity
 * @returns {Object} - The mapped response object with HATEOAS links
 */
export function mapActivityToResponse(activity) {
  const {
    id,
    daysFishedOther,
    daysFishedWithMandatoryRelease,
    version,
    updatedAt,
    createdAt
  } = activity

  const baseUrl = getBaseUrl()
  const activityUrl = `${baseUrl}/api/activities/${id}`

  return {
    id,
    daysFishedOther,
    daysFishedWithMandatoryRelease,
    version,
    updatedAt,
    createdAt,
    _links: {
      self: {
        href: activityUrl
      },
      activity: {
        href: activityUrl
      },
      submission: {
        href: `${activityUrl}/submission`
      },
      catches: {
        href: `${activityUrl}/catches`
      },
      river: {
        href: `${activityUrl}/river`
      },
      smallCatches: {
        href: `${activityUrl}/smallCatches`
      }
    }
  }
}
