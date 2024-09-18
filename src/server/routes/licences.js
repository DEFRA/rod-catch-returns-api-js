import { dynamicsClient } from '@defra-fish/dynamics-lib'

export default [
  {
    method: 'GET',
    path: '/licence/{licence}',
    options: {
      /**
       * Retrieve a licence and its associated contact based on the given licence and postcode
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object, that has the
       *    - licenceNumber - the licence number used to retrieve licence information
       *    - verification - used to verify the licence number
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {import('@hapi/hapi').ResponseObject} - A response containing the target {@link Licence} or a 403 status if not found
       */
      handler: async (request, h) => {
        const licenceNumber = request.params.licence
        const postcode = request.query.verification

        const dynamicsRequest = {
          PermissionNumber: licenceNumber,
          InputPostCode: postcode
        }

        try {
          const result = await dynamicsClient.executeUnboundAction(
            'defra_GetContactByLicenceAndPostcode',
            dynamicsRequest
          )
          // const result = await dynamicsClient.retrieve()
          console.log(result)
          return h.response(result).code(200)
        } catch (e) {
          console.log(e)
          return h.response([]).code(403)
        }
      },
      description:
        'Retrieve a licence and its associated contact based on the given licence and postcode',
      notes:
        'Retrieve a licence and its associated contact based on the given licence and postcode',
      tags: ['api', 'licence']
    }
  }
]
