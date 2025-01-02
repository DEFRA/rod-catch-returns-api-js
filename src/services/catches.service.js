import { Catch } from '../entities/index.js'

/**
 * Get a catch by its ID
 *
 * @param {number|string} catchId - The ID of the catch
 * @returns {Promise<Catch>} - A promise that resolves to `true` if the activity exists, otherwise `false`.
 */
export const getCatchById = async (catchId) => {
  return Catch.findOne({
    where: { id: catchId }
  })
}
