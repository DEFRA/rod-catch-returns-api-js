import { Submission } from '../entities/submission.entity.js'

export const isSubmissionExists = async (submissionId) => {
  const submission = await Submission.findOne({ where: { id: submissionId } })
  if (submission) {
    return true
  }

  return false
}

export const isUniqueRiverPerSubmission = async (
  submissionId,
  activityId,
  riverId
) => {
  const submission = await Submission.findOne({
    where: {
      id: submissionId
    }
  })

  if (!submission) {
    throw new Error('Submission not found')
  }
}
