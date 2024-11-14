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

/**
 * Retrieves a submission from the database by its ID.
 *
 * @param {number|string} submissionId - The ID of the submission to retrieve.
 * @returns {Promise<Submission|null>} - A promise that resolves to the submission object if found, otherwise `null`.
 */
export const getSubmission = async (submissionId) => {
  return Submission.findOne({
    where: {
      id: submissionId
    }
  })
}
