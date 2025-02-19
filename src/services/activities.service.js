import { Activity, Submission } from '../entities/index.js'
import { Op } from 'sequelize'

/**
 * Checks if an activity exists in the database for a given submission and river.
 *
 * @param {number|string} submissionId - The ID of the submission associated with the activity.
 * @param {number|string} riverId - The ID of the river associated with the activity.
 * @param {number|string|null} [activityId=null] - The ID of the activity to ignore in the check.
 * @returns {Promise<boolean>} - A promise that resolves to `true` if the activity exists, otherwise `false`.
 */
export const isActivityExists = async (
  submissionId,
  riverId,
  activityId = null
) => {
  const whereClause = {
    submission_id: submissionId,
    river_id: riverId
  }

  // Add condition to exclude a specific activityId if provided
  if (activityId !== null) {
    whereClause.id = { [Op.ne]: activityId }
  }

  const count = await Activity.count({
    where: whereClause
  })
  return count > 0
}

/**
 * Fetches the associated Submission by the given Activity ID.
 *
 * @param {number} activityId - The ID of the activity for which to fetch the submission.
 * @returns {Promise<Submission>} - A promise that resolves to the Submission associated with the given Activity ID.
 * @throws {Error} - Throws an error if no submission is found or if the query fails.
 */
export const getSubmissionByActivityId = async (activityId) => {
  try {
    const activity = await Activity.findOne({
      where: { id: activityId },
      include: [
        {
          model: Submission,
          required: true
        }
      ]
    })

    if (!activity) {
      throw new Error(`No submission found for activity ID ${activityId}`)
    }

    return activity.Submission
  } catch (error) {
    throw new Error(
      `Failed to fetch submission for activity ID ${activityId}: ${error}`
    )
  }
}
