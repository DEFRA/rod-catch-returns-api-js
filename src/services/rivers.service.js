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
    throw new Error('RIVER_NOT_FOUND')
  }

  // Normal users cannot add internal rivers, but admin users can
  return foundRiver.toJSON().internal || false
}

export const isRiverInternals = async (riverId, cache) => {
  const cacheKey = `river:${riverId}`

  if (cache) {
    const cached = await cache.get(cacheKey)
    if (cached !== null) {
      return cached
    }
  }

  const river = await River.findByPk(riverId, {
    attributes: ['internal'],
    raw: true
  })

  if (!river) {
    throw new Error('RIVER_NOT_FOUND')
  }

  const isInternal = Boolean(river.internal)

  if (cache) {
    await cache.set(cacheKey, isInternal)
  }

  return isInternal
}
