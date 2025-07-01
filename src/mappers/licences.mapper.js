/**
 * Validates the CRM permission response.
 *
 * @param {Array} permission - The response array from the Dynamics API.
 * @param {Array} fullLicenceNumber - The full licence number
 * @throws {Error} If the permission data is missing or invalid.
 */
export const validatePermission = (permission, fullLicenceNumber) => {
  if (!Array.isArray(permission) || permission.length === 0) {
    throw new Error(`Permission not found for ${fullLicenceNumber}`)
  }

  const [licenceData] = permission

  if (
    !licenceData.entity?.referenceNumber ||
    !licenceData.expanded?.licensee?.entity?.id
  ) {
    throw new Error('Invalid permission data: Missing required fields.')
  }

  return licenceData
}

/**
 * Maps a CRM permission response to a structured licence object.
 * Note: This function does not perform validation. If the permission data
 * may be incomplete or unverified, call {@link validatePermission} before using this function.
 *
 * @param {Array} permission - The response array from the Dynamics API.
 * @returns {Object} - The mapped licence object.
 *
 * @typedef {Object} MappedLicence
 * @property {string} licenceNumber - The full licence number.
 * @property {Object} contact - The contact details.
 * @property {string} contact.id - The contact ID.
 * @property {string} contact.fullName - The full name of the contact.
 */
export const mapCRMPermissionToLicence = (permission) => {
  const [licenceData] = permission
  const contact = licenceData.expanded.licensee.entity

  return {
    licenceNumber: licenceData.entity.referenceNumber,
    contact: {
      id: contact.id,
      fullName:
        [contact.firstName, contact.lastName]
          .filter(
            (name) => name !== null && name !== undefined && name.trim() !== ''
          )
          .join(' ') || 'Unknown'
    }
  }
}
