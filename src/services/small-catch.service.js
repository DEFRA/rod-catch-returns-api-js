import { SmallCatch } from '../entities/index.js'

/**
 * Checks if a small catch record with the specified activity ID and month already exists.
 *
 * @param {number|string} activityId - The ID of the activity associated with the small catch.
 * @param {number} month - The month number (1-12) for the small catch.
 * @returns {Promise<boolean>} - A promise that resolves to `true` if a duplicate exists, otherwise `false`.
 */
export const isDuplicateSmallCatch = async (activityId, month) => {
  const count = await SmallCatch.count({
    where: {
      activity_id: activityId,
      month
    }
  })
  return count > 0
}
