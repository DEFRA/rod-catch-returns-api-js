import { Method } from '../entities/index.js'

/**
 * Checks if a method is marked as internal in the database by its ID.
 *
 * @param {number|string} methodId - The ID of the method to check.
 * @returns {Promise<boolean>} - A promise that resolves to `true` if the method is internal, otherwise `false`.
 * @throws {Error} - If the method does not exist in the database.
 */
export const isMethodInternal = async (methodId, cache) => {
  // const foundMethod = await Method.findOne({ where: { id: methodId } })
  // if (foundMethod === null) {
  //   throw new Error(`Method does not exist: ${methodId}`)
  // }

  // // Normal users cannot add internal methods, but admin users can
  // return foundMethod.toJSON().internal || false

  const cacheKey = `method/${methodId}-internal`

  if (cache) {
    const cached = await cache.get(cacheKey)
    if (cached !== null) {
      return cached
    }
  }

  const foundMethod = await Method.findByPk(methodId, {
    attributes: ['internal'],
    raw: true
  })

  if (!foundMethod) {
    throw new Error(`Method does not exist: ${methodId}`)
  }

  const isInternal = Boolean(foundMethod.internal)

  if (cache) {
    await cache.set(cacheKey, isInternal)
  }

  return isInternal
}

/**
 * Checks if any method in the provided list is marked as internal.
 *
 * @param {Array<number|string>} methodIds - An array of method IDs to check.
 * @returns {Promise<boolean>} - A promise that resolves to `true` if all the methods exist and none are internal, otherwise `false`
 * @throws {Error} - If any method does not exist or if any method is internal.
 */
export const isMethodsInternal = async (methodIds) => {
  const foundMethods = await Method.findAll({ where: { id: methodIds } })

  // Check if all methods were found
  const foundIds = new Set(foundMethods.map((method) => method.id))
  const missingIds = methodIds.filter((id) => !foundIds.has(id))

  if (missingIds.length > 0) {
    throw new Error(`Methods do not exist: ${missingIds.join(', ')}`)
  }

  return foundMethods.some((method) => method.toJSON().internal)
}
