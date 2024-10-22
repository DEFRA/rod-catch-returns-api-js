import { Activity } from '../entities/activity.entity.js'

export const isActivityExists = async (submissionId, riverId) => {
  const count = await Activity.count({
    where: {
      submission_id: submissionId,
      river_id: riverId
    }
  })
  return count > 0
}
