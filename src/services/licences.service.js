import {
  contactAndPermissionForLicensee,
  executeQuery
} from '@defra-fish/dynamics-lib'

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
  const query = contactAndPermissionForLicensee(
    permissionReferenceNumberLast6Characters,
    licenseePostcode
  )

  const result = await executeQuery(query)

  return result
}
