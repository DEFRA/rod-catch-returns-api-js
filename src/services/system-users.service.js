import {
  Role,
  SystemUser,
  SystemUserRole,
  findByExample,
  retrieveMultipleAsMap
} from '@defra-fish/dynamics-lib'

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

export const getSystemUser = async (oid) => {
  const matchedUsers = await findByExample(
    Object.assign(new SystemUser(), { oid })
  )
  if (matchedUsers.length !== 1) {
    throw new Error('Unable to fetch system users')
  }

  const user = matchedUsers[0]
  const userRoles = await findByExample(
    Object.assign(new SystemUserRole(), { systemUserId: user.id })
  )

  const roles = await getReferenceDataForEntity(Role)

  return {
    ...user.toJSON(),
    roles: userRoles.map((userRole) =>
      roles.find((role) => role.id === userRole.roleId)
    )
  }
}
