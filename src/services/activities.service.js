import { Activity } from '../entities/activity.entity.js'

/**
 * Checks if an activity exists in the database for a given submission and river.
 *
 * @param {number|string} submissionId - The ID of the submission associated with the activity.
 * @param {number|string} riverId - The ID of the river associated with the activity.
 * @returns {Promise<boolean>} - A promise that resolves to `true` if the activity exists, otherwise `false`.
 */
export const isActivityExists = async (submissionId, riverId) => {
  const count = await Activity.count({
    where: {
      submission_id: submissionId,
      river_id: riverId
    }
  })
  return count > 0
}
