import { initialiseAssociations } from '../entity-utils.js'
describe('entity-utils.unit', () => {
  describe('initialiseAssociations', () => {
    it('should call associate on entities that have an associate method', () => {
      const mockAssociate = jest.fn()

      const entities = {
        River: { associate: mockAssociate },
        Catchment: { associate: mockAssociate }
      }

      initialiseAssociations(entities)

      expect(mockAssociate).toHaveBeenCalledTimes(2)
      expect(mockAssociate).toHaveBeenCalledWith(entities)
    })

    it('should not call associate on entities that do not have an associate method', () => {
      const mockAssociate = jest.fn()

      const entities = {
        River: { associate: mockAssociate },
        Catchment: {}
      }

      initialiseAssociations(entities)

      expect(mockAssociate).toHaveBeenCalledTimes(1)
      expect(mockAssociate).toHaveBeenCalledWith(entities)
    })

    it('should handle an empty entities object without errors', () => {
      const entities = {}

      initialiseAssociations(entities)

      expect(Object.keys(entities).length).toBe(0)
    })
  })
})
