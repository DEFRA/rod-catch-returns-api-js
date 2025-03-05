import {
  Role,
  SystemUser,
  SystemUserRole,
  findByExample,
  retrieveMultipleAsMap
} from '@defra-fish/dynamics-lib'
import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import logger from '../../utils/logger-utils.js'

export const systemUsersRequestParamsSchema = Joi.object({
  oid: Joi.string()
    .guid()
    .required()
    .description('The Azure Active Directory Object ID')
}).label('system-user-request-params')

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

export default [
  {
    method: 'GET',
    path: '/systemUsers/{oid}',
    options: {
      /**
       * Retrieve a system user by oid
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link Region}
       */
      handler: async (request, h) => {
        try {
          const matchedUsers = await findByExample(
            Object.assign(new SystemUser(), { oid: request.params.oid })
          )
          if (matchedUsers.length !== 1) {
            throw h
              .response({ error: 'Unable to fetch system users' })
              .code(StatusCodes.INTERNAL_SERVER_ERROR)
          }

          const user = matchedUsers[0]
          const userRoles = await findByExample(
            Object.assign(new SystemUserRole(), { systemUserId: user.id })
          )

          const roles = await getReferenceDataForEntity(Role)

          return h
            .response({
              ...user.toJSON(),
              roles: userRoles.map((userRole) =>
                roles.find((role) => role.id === userRole.roleId)
              )
            })
            .code(StatusCodes.OK)
        } catch (error) {
          logger.error('Error fetching system users:', error)
          return h
            .response({ error: 'Unable to fetch system users' })
            .code(StatusCodes.INTERNAL_SERVER_ERROR)
        }
      },
      validate: {
        params: systemUsersRequestParamsSchema
      },
      description:
        'Retrieve user information for the given azure directory object id',
      notes:
        'Retrieve user information for the given azure directory object id',
      tags: ['api', 'systemUsers']
    }
  }
]
