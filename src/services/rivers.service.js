import { River } from '../entities/index.js'

/**
 * Checks if a river is marked as internal in the database by its ID.
 *
 * @param {number|string} riverId - The ID of the river to check.
 * @returns {Promise<boolean>} - A promise that resolves to `true` if the river is internal, otherwise `false`.
 * @throws {Error} - If the river does not exist in the database.
 */
export const isRiverInternal = async (riverId) => {
  const foundRiver = await River.findOne({ where: { id: riverId } })
  if (foundRiver === null) {
    throw new Error('River does not exist')
  }

  // Normal users cannot add internal rivers, but admin users can
  return foundRiver.toJSON().internal || false
}
