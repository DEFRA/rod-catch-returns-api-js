import { Activity } from '../entities/activity.entity.js'

export const isActivityExists = async (submissionId, riverId) => {
  const activity = await Activity.findOne({
    where: {
      submission_id: submissionId,
      river_id: riverId
    }
  })

  if (activity) {
    return true
  }

  return false
}
