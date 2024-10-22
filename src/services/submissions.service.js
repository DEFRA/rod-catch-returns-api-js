import { Submission } from '../entities/submission.entity.js'

/**
 * Checks if a submission exists in the database by its ID.
 *
 * @param {number|string} submissionId - The ID of the submission to check.
 * @returns {Promise<boolean>} - A promise that resolves to `true` if the submission exists, otherwise `false`.
 */
export const isSubmissionExists = async (submissionId) => {
  const count = await Submission.count({ where: { id: submissionId } })
  return count > 0
}
