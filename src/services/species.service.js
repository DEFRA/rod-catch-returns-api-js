import { Species } from '../entities/index.js'

/**
 * Checks if a species exists in the database by its ID.
 *
 * @param {number|string} speciesId - The ID of the submission to check.
 * @returns {Promise<boolean>} - A promise that resolves to `true` if the species exists, otherwise `false`.
 */
export const isSpeciesExists = async (speciesId) => {
  const count = await Species.count({ where: { id: speciesId } })
  return count > 0
}
