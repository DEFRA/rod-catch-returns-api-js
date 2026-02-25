import {
  contactAndPermissionForLicensee,
  executeQuery
} from '@defra-fish/dynamics-lib'
import logger from '../utils/logger-utils.js'

/**
 * Calls CRM to retrieve a permission (and its associated licensee contact)
 * by the last 6 characters of the permission reference number and postcode.
 *
 * @param {string} permissionReferenceNumberLast6Characters - The last 6 characters of the permission reference number
 * @param {string} licenseePostcode - The postcode of the contact associated with the permission
 *
 * @returns {Promise<Array<{
 *   entity: {
 *     id: string,
 *     referenceNumber: string,
 *     issueDate: string,
 *     startDate: string,
 *     endDate: string,
 *     stagingId: string,
 *     dataSource: {
 *       id: number,
 *       label: string,
 *       description: string
 *     },
 *     isRenewal: boolean,
 *     isRecurringPayment: boolean | null,
 *     isLicenceForYou: boolean | null
 *   },
 *   expanded: {
 *     licensee: {
 *       entity: {
 *         id: string,
 *         postcode: string
 *       }
 *     }
 *   }
 * }>>}
 */
export const getContactForLicensee = async (
  permissionReferenceNumberLast6Characters,
  licenseePostcode
) => {
  let result
  try {
    const query = contactAndPermissionForLicensee(
      permissionReferenceNumberLast6Characters,
      licenseePostcode
    )

    result = await executeQuery(query)

    console.log(JSON.stringify(result, null, 2))

    logger.info('Result from CRM %s', JSON.stringify(result))

    return result
  } catch (error) {
    logger.info(
      'Error with CRM query with request %s and %s. Response: %s',
      permissionReferenceNumberLast6Characters,
      licenseePostcode,
      JSON.stringify(result)
    )
    throw error
  }
}
