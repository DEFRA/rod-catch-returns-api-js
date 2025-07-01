/**
 * Validates the CRM permission response.
 *
 * @param {Array} permission - The response array from the Dynamics API.
 * @throws {Error} If the permission data is missing or invalid.
 */
const validatePermission = (permission) => {
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
  const licenceData = validatePermission(permission)
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
