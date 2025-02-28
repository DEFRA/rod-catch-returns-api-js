import { Catch } from '../entities/index.js'

/**
 * Get a catch by its ID
 *
 * @param {number|string} catchId - The ID of the catch
 * @returns {Promise<Catch>} - A promise that returns the first instance found, or null if none can be found.
 */
export const getCatchById = async (catchId) => {
  return Catch.findOne({
    where: { id: catchId }
  })
}
