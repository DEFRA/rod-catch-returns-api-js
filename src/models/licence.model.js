export class Licence {
  /**
   * @param {string} licenceNumber - The licence number.
   * @param {import ('./contact.model').Contact } contact - The contact information
   */
  constructor(licenceNumber, contact) {
    this.licenceNumber = licenceNumber
    this.contact = contact
  }
}
