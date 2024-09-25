import {
  licenceLoginRequestParamSchema,
  licenceLoginRequestQuerySchema
} from '../../schema/licences.schema.js'
import { Contact } from '../../models/contact.model.js'
import { Licence } from '../../models/licence.model.js'
import { StatusCodes } from 'http-status-codes'
import { contactForLicensee } from '@defra-fish/dynamics-lib'
import logger from '../../utils/logger-utils.js'

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
            const contact = new Contact()
            contact.id = result.ContactId
            contact.postcode = result.Postcode
            const licence = new Licence(result.ReturnPermissionNumber, contact)
            return h.response(licence).code(StatusCodes.OK)
          }
        } catch (e) {
          logger.error(e)
          throw e
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
  }
]
