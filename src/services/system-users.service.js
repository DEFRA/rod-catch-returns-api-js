import {
  Role,
  SystemUser,
  SystemUserRole,
  findByExample
} from '@defra-fish/dynamics-lib'
import { getReferenceDataForEntity } from './reference-data.service.js'

export const ENTITY_TYPES = [Role]

const CACHE_TTL_MS_USER = 300000 // cache for 5 mins

export const getSystemUserByOid = async (oid, cache) => {
  const cachedResponse = await cache.get(oid)
  if (cachedResponse) {
    return cachedResponse
  }

  const matchedUsers = await findByExample(
    Object.assign(new SystemUser(), { oid })
  )
  if (matchedUsers.length !== 1) {
    throw new Error(`Unable to fetch system user ${oid}`)
  }

  const user = matchedUsers[0]
  const userRoles = await findByExample(
    Object.assign(new SystemUserRole(), { systemUserId: user.id })
  )

  const roles = await getReferenceDataForEntity(Role)

  const result = {
    ...user.toJSON(),
    roles: userRoles.map((userRole) =>
      roles.find((role) => role.id === userRole.roleId)
    )
  }

  await cache.set(oid, result, CACHE_TTL_MS_USER)

  return result
}
