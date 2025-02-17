/**
 * Maps a CRM permission response to a structured licence object.
 *
 * @param {Array} permission - The response array from the Dynamics API.
 * @returns {Object|null} - The mapped licence object or null if the response is invalid.
 *
 * @typedef {Object} MappedLicence
 * @property {string} licenceNumber - The full licence number.
 * @property {Object} contact - The contact details.
 * @property {string} contact.id - The contact ID.
 * @property {string} contact.fullName - The full name of the contact.
 */
export const mapCRMPermissionToLicence = (permission) => {
  if (!Array.isArray(permission) || permission.length === 0) {
    return null
  }

  const licenceData = permission[0]

  if (
    !licenceData.entity?.referenceNumber ||
    !licenceData.expanded?.licensee?.entity?.id
  ) {
    return null
  }

  const contact = licenceData.expanded.licensee.entity
  const fullName =
    [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Unknown'

  return {
    licenceNumber: licenceData.entity.referenceNumber,
    contact: {
      id: contact.id,
      fullName
    }
  }
}
