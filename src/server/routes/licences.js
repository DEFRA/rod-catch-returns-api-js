import {
  contactForLicensee,
  executeQuery,
  permissionForFullReferenceNumber
} from '@defra-fish/dynamics-lib'
import {
  fullLicenceLoginRequestParamSchema,
  licenceLoginRequestParamSchema,
  licenceLoginRequestQuerySchema
} from '../../schemas/licences.schema.js'
import { Contact } from '../../models/contact.model.js'
import { Licence } from '../../models/licence.model.js'
import { StatusCodes } from 'http-status-codes'
import { handleServerError } from '../../utils/server-utils.js'
import logger from '../../utils/logger-utils.js'
import { mapCRMPermissionToLicence } from '../../mappers/licences.mapper.js'

export default [
  {
    method: 'GET',
    path: '/licence/{licence}',
    options: {
      /**
       * Retrieve a licence and its associated contact based on the given last 6 digits of the licence number and postcode
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object, that has the
       *     @param {string} request.params.licence - The last 6 digits of the licence number
       *     @param {string} request.query.verification - The postcode to cross-check against the licence number
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link Licence} or a 403 status if not found
       */
      handler: async (request, h) => {
        const permissionReferenceNumberLast6Characters = request.params.licence
        const licenseePostcode = request.query.verification

        try {
          logger.info(
            'Fetching contact with licence ending:%s and postcode%s',
            permissionReferenceNumberLast6Characters,
            licenseePostcode
          )
          const result = await contactForLicensee(
            permissionReferenceNumberLast6Characters,
            licenseePostcode
          )

          if (result.ReturnStatus !== 'success') {
            logger.info(
              'Login unsuccessful with request %s and %s. Response: %s',
              permissionReferenceNumberLast6Characters,
              licenseePostcode,
              JSON.stringify(result)
            )
            return h.response().code(StatusCodes.FORBIDDEN)
          } else {
            logger.info(
              'Contact found with licence ending:%s and postcode%s with contact id:%s',
              permissionReferenceNumberLast6Characters,
              licenseePostcode,
              result.ContactId
            )
            const contact = new Contact()
            contact.id = result.ContactId
            contact.postcode = result.Postcode
            const licence = new Licence(result.ReturnPermissionNumber, contact)
            return h.response(licence).code(StatusCodes.OK)
          }
        } catch (error) {
          return handleServerError('Error with user login', error, h)
        }
      },
      validate: {
        params: licenceLoginRequestParamSchema,
        query: licenceLoginRequestQuerySchema
      },
      description:
        'Retrieve a licence and its associated contact based on the given last 6 digits of the licence number and postcode',
      notes:
        'Retrieve a licence and its associated contact based on the given last 6 digits of the licence number and postcode',
      tags: ['api', 'licence']
    }
  },
  {
    method: 'GET',
    path: '/licence/full/{licence}',
    options: {
      /**
       * Retrieve a licence and its associated contact based on the full licence number
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       *     @param {string} request.params.licence - The full licence number used to retrieve licence information
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link River}
       */
      handler: async (request, h) => {
        try {
          const fullLicenceNumber = request.params.licence
          const result = await executeQuery(
            permissionForFullReferenceNumber(fullLicenceNumber)
          )
          try {
            const mappedResult = mapCRMPermissionToLicence(result)
            return h.response(mappedResult).code(StatusCodes.OK)
          } catch (mapperError) {
            logger.error(mapperError)
            return h
              .response({ message: mapperError.message })
              .code(StatusCodes.FORBIDDEN)
          }
        } catch (error) {
          return handleServerError(
            'Error fetching licence information',
            error,
            h
          )
        }
      },
      validate: {
        params: fullLicenceLoginRequestParamSchema,
        options: { entity: 'Licence' }
      },
      description:
        'Retrieve a licence and its associated contact based on the full licence number',
      notes:
        'Retrieve a licence and its associated contact based on the full licence number',
      tags: ['api', 'licence']
    }
  }
]
