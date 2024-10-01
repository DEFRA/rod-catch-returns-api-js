/**
 * Calls the `associate` method for each entity in the provided entities object.
 *
 * @param {Object} entities - An object containing Sequelize entities.
 * @returns {void}
 */
export const initialiseAssociations = (entities) => {
  Object.keys(entities).forEach((entityName) => {
    if (entities[entityName].associate) {
      entities[entityName].associate(entities)
    }
  })
}
