import { extractActivityId, extractMethodId } from '../utils/entity-utils.js'
import {
  getMonthNameFromNumber,
  getMonthNumberFromName
} from '../utils/date-utils.js'
import { getBaseUrl } from '../utils/url-utils.js'

export const mapRequestToSmallCatch = ({
  activity,
  month,
  released,
  counts,
  noMonthRecorded,
  reportingExclude
}) => {
  const activityId = extractActivityId(activity)
  const monthInt = getMonthNumberFromName(month)

  return {
    month: monthInt,
    released,
    activity_id: activityId,
    noMonthRecorded,
    reportingExclude,
    counts: counts.map((count) => ({
      count: count.count,
      method_id: extractMethodId(count.method)
    })),
    version: new Date()
  }
}

/**
 * Maps a SmallCatchCount entity to a response object.
 *
 * @param {import('@hapi/hapi').Request} request - The Hapi request object
 * @param {import('../entities/index.js').SmallCatchCount} smallCatchCount - The SmallCatchCount entity
 * @returns {Object} - The mapped response object with HATEOAS links
 */
export const mapSmallCatchCountToResponse = (request, smallCatchCount) => {
  const baseUrl = getBaseUrl(request)

  return {
    count: smallCatchCount.count,
    _links: {
      method: {
        href: `${baseUrl}/api/methods/${smallCatchCount.method_id}`
      }
    }
  }
}

/**
 * Maps a SmallCatch entity to a response object.
 *
 * @param {import('@hapi/hapi').Request} request - The Hapi request object
 * @param {import('../entities/index.js').SmallCatch} smallCatch - The SmallCatch entity
 * @returns {Object} - The mapped response object with HATEOAS links
 */
export function mapSmallCatchToResponse(request, smallCatch) {
  const {
    id,
    month,
    released,
    reportingExclude,
    noMonthRecorded,
    counts,
    version,
    updatedAt,
    createdAt
  } = smallCatch

  const baseUrl = getBaseUrl(request)
  const smallCatchUrl = `${baseUrl}/api/smallCatches/${id}`

  return {
    id,
    month: getMonthNameFromNumber(month),
    released,
    reportingExclude,
    noMonthRecorded,
    count: counts.map((count) => mapSmallCatchCountToResponse(request, count)),
    version,
    updatedAt,
    createdAt,
    _links: {
      self: {
        href: smallCatchUrl
      },
      smallCatch: {
        href: smallCatchUrl
      },
      activityEntity: {
        href: `${baseUrl}/api/activities/${smallCatch.activity_id}`
      },
      activity: {
        href: `${smallCatchUrl}/activity`
      }
    }
  }
}
