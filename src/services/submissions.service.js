import { Submission } from '../entities/submission.entity.js'

export const isSubmissionExists = async (submissionId) => {
  const count = await Submission.count({ where: { id: submissionId } })
  return count > 0
}
