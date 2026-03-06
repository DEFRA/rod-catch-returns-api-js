import { Activity, Catch, Submission } from '../entities/index.js'
import {
  Contact,
  RCRActivity,
  RCR_ACTIVITY_STATUS,
  executeQuery,
  persist,
  rcrActivityForContact
} from '@defra-fish/dynamics-lib'
import logger from '../utils/logger-utils.js'

/**
 * Checks if a submission exists in the database by its ID.
 *
 * @param {number|string} submissionId - The ID of the submission to check.
 * @returns {Promise<boolean>} - A promise that resolves to `true` if the submission exists, otherwise `false`.
 */
export const isSubmissionExistsById = async (submissionId) => {
  const count = await Submission.count({ where: { id: submissionId } })
  return count > 0
}

/**
 * Checks if a submission exists in the database by the contactId and season.
 *
 * @param {string} contactId - The ID of the contact retrieved from CRM
 * @param {string} season - The season of the submission
 * @returns {Promise<boolean>} - A promise that resolves to `true` if the submission exists, otherwise `false`.
 */
export const isSubmissionExistsByUserAndSeason = async (contactId, season) => {
  const count = await Submission.count({ where: { contactId, season } })
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

/**
 * Fetches the associated Submission by the given catch ID.
 *
 * This function traverses the relationships between the `Catch`, `Activity`,
 * and `Submission` models to find the `Submission` corresponding to the given `Catch` ID.
 *
 * @param {number} catch - The ID of the catch for which to fetch the submission.
 * @returns {Promise<Submission>} - A promise that resolves to the Submission associated with the given catch ID.
 * @throws {Error} - Throws an error if no submission is found or if the query fails.
 */
export const getSubmissionByCatchId = async (catchId) => {
  try {
    const catchWithActivityAndSubmission = await Catch.findOne({
      where: { id: catchId },
      include: {
        model: Activity,
        include: Submission
      }
    })

    if (!catchWithActivityAndSubmission) {
      throw new Error(`No Catch found for catch ID ${catchId}`)
    }

    if (!catchWithActivityAndSubmission.Activity) {
      throw new Error(`No Activity found for catch ID ${catchId}`)
    }

    return catchWithActivityAndSubmission.Activity.Submission
  } catch (error) {
    throw new Error(
      `Failed to fetch submission for catch ID ${catchId}: ${error}`
    )
  }
}
/**
 * Handle CRM activity creation with logging
 * @param {string} contactId
 * @param {string|number} season
 */
export const handleCreateCrmActivity = async (contactId, season) => {
  logger.info(
    `Fetching RCR CRM Activities for create: contactId=${contactId}, season=${season}`
  )

  const getActivitiesResult = await getCRMActivitiesContactById(
    contactId,
    season
  )

  logger.info(
    `RCR CRM Activities found for create: contactId=${contactId}, season=${season}, result=${JSON.stringify(getActivitiesResult)}`
  )

  if (getActivitiesResult.length === 0) {
    logger.info(
      `No RCR CRM Activities found for contactId=${contactId}, season=${season} creating now`
    )

    try {
      await createCRMActivity(contactId, season)
    } catch (err) {
      logger.error(
        `Error creating RCR CRM Activity for contactId=${contactId}, season=${season}, please check the database and crm to see if the details match`
      )
      throw err
    }

    logger.info(
      `RCR CRM Activity created for contactId=${contactId}, season=${season}`
    )
  } else {
    logger.info(
      `RCR CRM Activity already found for contactId=${contactId}, season=${season} doing nothing`
    )
  }
}

/**
 * Retrieves CRM activities for a specific contact and season.
 *
 * @param {string} contactId - The unique identifier of the contact.
 * @param {string|number} season - The season year to filter activities by.
 *
 * @returns {Promise<Array<{
 *   entity: {
 *     id: string,
 *     status: number,
 *     season: number,
 *     startDate: string,        // ISO 8601 date string
 *     lastUpdated: string,      // ISO 8601 date string
 *     submittedDate: string | null
 *   },
 *   expanded: Record<string, any>
 * }>>}
 */
export const getCRMActivitiesContactById = async (contactId, season) => {
  const query = rcrActivityForContact(contactId, season)
  const result = await executeQuery(query)
  return result
}

/**
 * Creates a new CRM RCR activity for a contact for the specified season.
 *
 * @param {string} contactId - The unique identifier of the contact the RCR CRM Activity will be associated with.
 * @param {number} season - The season year for the RCR CRM Activity.
 *
 * @returns {Promise<string>} A promise that resolves to the ID of the newly created CRM Activity.
 */
export const createCRMActivity = async (contactId, season) => {
  const rcrActivity = new RCRActivity()
  rcrActivity.season = season
  rcrActivity.startDate = new Date()
  rcrActivity.status = RCR_ACTIVITY_STATUS.STARTED

  const contact = Contact.fromResponse({ contactid: contactId })
  rcrActivity.bindToEntity(
    RCRActivity.definition.relationships.licensee,
    contact
  )

  logger.info(
    `Creating RCR CRM Activity with details ${JSON.stringify(rcrActivity)} and contactId=${contactId}`
  )

  const result = await persist([rcrActivity])

  return result[0]
}

/**
 * Updates the RCR CRM activity for a given contact and season.
 *
 * @param {string} contactId - The unique identifier of the contact whose RCR CRM activity should be updated.
 * @param {number} season - The season year of the activity to update.
 *
 * @returns {Promise<void>} Resolves when the activity has been successfully updated.
 *
 * @throws {Error} Throws if the number of activities found is not exactly one.
 * @throws {Error} Throws if persisting the updated activity fails.
 */
export const handleUpdateCRMActivity = async (contactId, season) => {
  logger.info(
    `Fetching RCR CRM Activities for update: contactId=${contactId}, season=${season}`
  )
  const rcrActivityResult = await getCRMActivitiesContactById(contactId, season)

  logger.info(
    `RCR CRM Activities found for update: contactId=${contactId}, season=${season}, result=${JSON.stringify(rcrActivityResult)}`
  )

  if (rcrActivityResult.length !== 1) {
    throw new Error(
      `The number of RCR CRM Activities found for contactId=${contactId}, season=${season} is not 1 result=${JSON.stringify(rcrActivityResult)}`
    )
  }

  const rcrActivity = rcrActivityResult[0].entity
  rcrActivity.status = RCR_ACTIVITY_STATUS.SUBMITTED
  rcrActivity.submittedDate = new Date()
  logger.info(
    `Updating RCR CRM Activities for: contactId=${contactId}, season=${season} with details=${rcrActivity}`
  )

  try {
    await persist([rcrActivity])
  } catch (err) {
    logger.error(
      `Error updating RCR CRM Activity for contactId=${contactId}, season=${season}, please check the database and crm to see if the details match`
    )
    throw err
  }
}
