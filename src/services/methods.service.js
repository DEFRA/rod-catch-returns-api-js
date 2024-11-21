import { Method } from '../entities/index.js'

/**
 * Checks if a method is marked as internal in the database by its ID.
 *
 * @param {number|string} methodId - The ID of the method to check.
 * @returns {Promise<boolean>} - A promise that resolves to `true` if the method is internal, otherwise `false`.
 * @throws {Error} - If the method does not exist in the database.
 */
export const isMethodInternal = async (methodId) => {
  const foundMethod = await Method.findOne({ where: { id: methodId } })
  if (foundMethod === null) {
    throw new Error('Method does not exist')
  }

  // Normal users cannot add internal methods, but admin users can
  return foundMethod.toJSON().internal || false
}
