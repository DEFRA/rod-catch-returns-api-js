import { extractActivityId, extractMethodId } from '../utils/entity-utils.js'
import {
  getMonthNameFromNumber,
  getMonthNumberFromName
} from '../utils/date-utils.js'
import { getBaseUrl } from '../utils/url-utils.js'

/**
 * Maps an array of count objects to a new format, extracting the `method_id` and optionally
 * adding a `small_catch_id` property.
 *
 * @param {Array<{ count: number, method: string }>} countsArray - An array of objects, each containing a `count` and `method`.
 * @param {string} [smallCatchId] - The optional small catch ID to be included in each mapped object.
 * @returns {Array<{ count: number, method_id: string, small_catch_id?: string }>} A new array of objects containing `count`, `method_id`,
 * and optionally `small_catch_id`.
 *
 * @example
 * const countsArray = [
 *   { count: 3, method: 'method/1' },
 *   { count: 2, method: 'method/2' },
 *   { count: 1, method: 'method/3' }
 * ];
 * const smallCatchId = '123';
 * const result = mapCounts(countsArray, smallCatchId);
 * // [
 * //   { count: 3, method_id: '1', small_catch_id: '123' },
 * //   { count: 2, method_id: '2', small_catch_id: '123' },
 * //   { count: 1, method_id: '3', small_catch_id: '123' }
 * // ]
 */
export const mapCounts = (countsArray, smallCatchId) =>
  countsArray.map((count) => ({
    count: count.count,
    method_id: extractMethodId(count.method),
    ...(smallCatchId && { small_catch_id: smallCatchId })
  }))

/**
 * Maps a request object to a `SmallCatch` entity format, transforming and including only relevant properties.
 *
 * @param {Object} request - The request object containing properties to map.
 * @param {string} request.activity - The activity identifier, potentially prefixed.
 * @param {string} [request.month] - The name of the month (e.g., "January") to be converted to a month number.
 * @param {boolean} [request.released] - Indicates whether the catch was released.
 * @param {Array<{ count: number, method: string }>} [request.counts] - An array of count objects to be mapped.
 * @param {boolean} [request.noMonthRecorded] - Indicates whether the month was not recorded.
 * @param {boolean} [request.reportingExclude] - Indicates whether the catch should be excluded from reporting.
 * @returns {Object} The mapped `SmallCatch` object containing the transformed properties.
 *
 * @property {Date} version - A timestamp indicating the version of the mapped object (always included).
 * @property {number} [month] - The numeric representation of the month, if provided.
 * @property {Array<{ count: number, method_id: string }>} [counts] - The mapped counts array, if provided.
 * @property {boolean} [released] - Whether the catch was released, if provided.
 * @property {boolean} [noMonthRecorded] - Whether the month was not recorded, if provided.
 * @property {boolean} [reportingExclude] - Whether the catch is excluded from reporting, if provided.
 * @property {string} [activity_id] - The extracted activity ID, if provided.
 *
 * @example
 * const request = {
 *   activity: 'activity/123',
 *   month: 'January',
 *   released: true,
 *   counts: [
 *     { count: 3, method: 'method/1' },
 *     { count: 2, method: 'method/2' }
 *   ],
 *   noMonthRecorded: false,
 *   reportingExclude: true
 * };
 * const result = mapRequestToSmallCatch(request);
 * // {
 * //   version: 2025-01-22T12:34:56.789Z,
 * //   month: 1,
 * //   counts: [
 * //     { count: 3, method_id: '1' },
 * //     { count: 2, method_id: '2' }
 * //   ],
 * //   released: true,
 * //   noMonthRecorded: false,
 * //   reportingExclude: true,
 * //   activity_id: '123'
 * // }
 */
export const mapRequestToSmallCatch = ({
  activity,
  month,
  released,
  counts,
  noMonthRecorded,
  reportingExclude
}) => {
  const mappedCatch = {
    version: new Date(), // Always included
    ...(month && { month: getMonthNumberFromName(month) }),
    ...(counts && {
      counts: mapCounts(counts)
    }),
    ...(typeof released !== 'undefined' && { released }),
    ...(typeof noMonthRecorded !== 'undefined' && { noMonthRecorded }),
    ...(typeof reportingExclude !== 'undefined' && { reportingExclude }),
    ...(activity && { activity_id: extractActivityId(activity) })
  }

  return mappedCatch
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
    counts: counts?.map((count) =>
      mapSmallCatchCountToResponse(request, count)
    ),
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
