import { getBaseUrl } from '../utils/url-utils.js'

/**
 * Maps a Submission entity to a response object.
 *
 * @param {import('../entities/index.js').Submission} submission - The Submission entity
 * @returns {Object} - The mapped response object with HATEOAS links
 */
export function mapSubmissionToResponse(submission) {
  const baseUrl = getBaseUrl()
  return {
    ...submission,
    _links: {
      self: {
        href: `${baseUrl}/api/submissions/${submission.id}`
      },
      submission: {
        href: `${baseUrl}/api/submissions/${submission.id}`
      },
      activities: {
        href: `${baseUrl}/api/submissions/${submission.id}/activities`
      }
    }
  }
}
