import { Role, retrieveMultipleAsMap } from '@defra-fish/dynamics-lib'

export const ENTITY_TYPES = [Role]

export async function getReferenceData() {
  return retrieveMultipleAsMap(...ENTITY_TYPES).cached()
}

/**
 * Retrieve all reference data records for the given entity type
 *
 * @template T
 * @param {typeof T} entityType
 * @returns {Promise<Array<T>>}
 */
export async function getReferenceDataForEntity(entityType) {
  const data = await getReferenceData()
  return data[entityType.definition.localCollection]
}
