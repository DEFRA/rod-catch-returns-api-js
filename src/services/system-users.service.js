import {
  Role,
  SystemUser,
  SystemUserRole,
  findByExample
} from '@defra-fish/dynamics-lib'
import { getReferenceDataForEntity } from './reference-data.service'

export const ENTITY_TYPES = [Role]

export const getSystemUserByOid = async (oid) => {
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

  return {
    ...user.toJSON(),
    roles: userRoles.map((userRole) =>
      roles.find((role) => role.id === userRole.roleId)
    )
  }
}
