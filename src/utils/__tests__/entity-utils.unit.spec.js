import {
  extractRiverId,
  extractSubmissionId,
  initialiseAssociations
} from '../entity-utils.js'

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

  describe('extractSubmissionId', () => {
    it('should remove "submissions/" prefix and return the ID', () => {
      const submission = 'submissions/12345'
      const result = extractSubmissionId(submission)
      expect(result).toBe('12345')
    })

    it('should return the original string if there is no "submissions/" prefix', () => {
      const submission = '12345'
      const result = extractSubmissionId(submission)
      expect(result).toBe('12345')
    })

    it('should return an empty string if the input is only "submissions/"', () => {
      const submission = 'submissions/'
      const result = extractSubmissionId(submission)
      expect(result).toBe('')
    })

    it('should handle an empty string input gracefully', () => {
      const submission = ''
      const result = extractSubmissionId(submission)
      expect(result).toBe('')
    })
  })

  describe('extractRiverId', () => {
    it('should remove "rivers/" prefix and return the ID', () => {
      const river = 'rivers/67890'
      const result = extractRiverId(river)
      expect(result).toBe('67890')
    })

    it('should return the original string if there is no "rivers/" prefix', () => {
      const river = '67890'
      const result = extractRiverId(river)
      expect(result).toBe('67890')
    })

    it('should return an empty string if the input is only "rivers/"', () => {
      const river = 'rivers/'
      const result = extractRiverId(river)
      expect(result).toBe('')
    })

    it('should handle an empty string input gracefully', () => {
      const river = ''
      const result = extractRiverId(river)
      expect(result).toBe('')
    })
  })
})
