import { SmallCatch, SmallCatchCount } from '../entities/index.js'
import { Op } from 'sequelize'
import { sumCounts } from '../utils/entity-utils.js'

/**
 * Checks if a small catch record with the specified activity ID and month already exists.
 *
 * @param {number|string} activityId - The ID of the activity associated with the small catch.
 * @param {number} month - The month number (1-12) for the small catch.
 * @param {number} [ignoreMonth] - The month number (1-12) to ignore in the check.
 * @returns {Promise<boolean>} - A promise that resolves to `true` if a duplicate exists, otherwise `false`.
 */
export const isDuplicateSmallCatch = async (activityId, month, ignoreMonth) => {
  const whereClause = {
    activity_id: activityId,
    month
  }

  // Add a condition to exclude the ignoreMonth if it is defined
  if (ignoreMonth !== undefined) {
    whereClause.month = {
      [Op.and]: [{ [Op.eq]: month }, { [Op.ne]: ignoreMonth }]
    }
  }

  const count = await SmallCatch.count({ where: whereClause })

  return count > 0
}

/**
 * Get a small catch by its ID
 *
 * @param {number|string} smallCatchId - The ID of the small catch
 * @returns {Promise<SmallCatch>} - A promise the returns the first instance found, or null if none can be found.
 */
export const getSmallCatchById = async (smallCatchId) => {
  return SmallCatch.findOne({
    where: { id: smallCatchId }
  })
}

/**
 * Retrieves the total count of all small catch counts associated with a specific small catch ID.
 *
 * @param {number|string} smallCatchId - The ID of the small catch for which to retrieve and sum the counts.
 * @returns {Promise<number>} - A promise that resolves to the total sum of counts for the given small catch ID.
 *                              Returns 0 if no counts exist.
 * @throws {Error} - Throws an error if the database query fails.
 */
export const getTotalSmallCatchCountsBySmallCatchId = async (smallCatchId) => {
  const smallCatchCounts = await SmallCatchCount.findAll({
    where: { small_catch_id: smallCatchId }
  })

  return sumCounts(smallCatchCounts)
}
