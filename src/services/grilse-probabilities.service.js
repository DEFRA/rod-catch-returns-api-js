import { GrilseProbability } from '../entities/index.js'

/**
 * Checks if grilse probabilities exist for a given season and gate.
 *
 * @param {number} season - The season (year) to check for probabilities.
 * @param {number} gate - The gate ID to check for probabilities.
 * @returns {Promise<boolean>} - Resolves to `true` if probabilities exist, otherwise `false`.
 */
export const isGrilseProbabilityExistsForSeasonAndGate = async (
  season,
  gate
) => {
  const count = await GrilseProbability.count({
    where: {
      season,
      gate_id: gate
    }
  })

  return count > 0
}

/**
 * Deletes all grilse probabilities for a given season and gate.
 *
 * @param {number} season - The season (year) for which probabilities should be deleted.
 * @param {number} gate - The gate ID for which probabilities should be deleted.
 * @returns {Promise<number>} - Resolves to the number of deleted records.
 */

export const deleteGrilseProbabilitiesForSeasonAndGate = (season, gate) => {
  return GrilseProbability.destroy({
    where: {
      season,
      gate_id: gate
    }
  })
}
