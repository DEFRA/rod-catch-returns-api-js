import { Submission } from '../entities/submission.entity.js'

export const checkSubmissionExistsById = async (submissionId) => {
  const submission = await Submission.findOne({ where: { id: submissionId } })
  if (submission) {
    return true
  }

  return false
}
