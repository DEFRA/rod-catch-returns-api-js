/**
 * Calls the `associate` method for each entity in the provided entities object.
 *
 * @param {Object} entities - An object containing Sequelize entities.
 * @returns {void}
 */
export const initialiseAssociations = (entities) => {
  Object.keys(entities).forEach((entityName) => {
    if (entities[entityName].associate) {
      entities[entityName].associate(entities)
    }
  })
}

/**
 * Extracts the submission ID from a given value by removing the submissions/ prefix.
 *
 * @param {string} submission - The value containing the prefix and ID.
 * @returns {string} - The extracted ID.
 */
export const extractSubmissionId = (submission) =>
  submission.replace('submissions/', '')

/**
 * Extracts the river ID from a given value by removing the rivers/ prefix.
 *
 * @param {string} river - The value containing the prefix and ID.
 * @returns {string} - The extracted ID.
 */
export const extractRiverId = (river) => river.replace('rivers/', '')

/**
 * Extracts the activity ID from a given value by removing the activities/ prefix.
 *
 * @param {string} activity - The value containing the prefix and ID.
 * @returns {string} - The extracted ID.
 */
export const extractActivityId = (activity) =>
  activity.replace('activities/', '')

/**
 * Extracts the method ID from a given value by removing the methods/ prefix.
 *
 * @param {string} method - The value containing the prefix and ID.
 * @returns {string} - The extracted ID.
 */
export const extractMethodId = (method) => method.replace('methods/', '')

/**
 * Extracts the species ID from a given value by removing the species/ prefix.
 *
 * @param {string} method - The value containing the prefix and ID.
 * @returns {string} - The extracted ID.
 */
export const extractSpeciesId = (species) => species.replace('species/', '')

/**
 * Sums the `count` properties of objects in an array.
 *
 * @param {Array<{ count: number }>} countsArray - An array of objects, each containing a `count` property.
 * @returns {number} The total sum of all `count` values in the array.
 */
export const sumCounts = (countsArray) =>
  countsArray.reduce((sum, item) => sum + item.count, 0)
