import { failAction } from '../error-utils.js'

describe('error-utils.unit', () => {
  describe('failAction', () => {
    const getMockH = () => ({
      response: jest.fn().mockReturnThis(),
      code: jest.fn().mockReturnThis(),
      takeover: jest.fn().mockReturnValue('takeover-result')
    })

    const getMockRequest = () => ({
      route: {
        settings: {
          validate: {
            options: { entity: 'Activity' }
          }
        }
      }
    })

    const getDefaultMockError = () => ({
      details: [
        {
          message: '"name" is required',
          context: {
            label: 'name',
            value: ''
          }
        },
        {
          message: '"age" must be a number',
          context: {
            label: 'age',
            value: 'not-a-number'
          }
        }
      ]
    })

    it('should format Joi validation errors correctly', () => {
      const mockH = getMockH()
      failAction(getMockRequest(), mockH, getDefaultMockError())

      expect(mockH.response).toHaveBeenCalledWith({
        errors: [
          {
            entity: 'Activity',
            message: '"name" is required',
            property: 'name',
            value: ''
          },
          {
            entity: 'Activity',
            message: '"age" must be a number',
            property: 'age',
            value: 'not-a-number'
          }
        ]
      })
    })

    it('should return entity as Unknown if it is not present in the request', () => {
      const mockH = getMockH()
      failAction({}, mockH, getDefaultMockError())

      expect(mockH.response).toHaveBeenCalledWith({
        errors: [
          {
            entity: 'Unknown',
            message: '"name" is required',
            property: 'name',
            value: ''
          },
          {
            entity: 'Unknown',
            message: '"age" must be a number',
            property: 'age',
            value: 'not-a-number'
          }
        ]
      })
    })

    it('should return 400', () => {
      const mockH = getMockH()
      failAction({}, mockH, getDefaultMockError())

      expect(mockH.code).toHaveBeenCalledWith(400)
    })

    it('should call takeover', () => {
      const mockH = getMockH()
      failAction({}, mockH, getDefaultMockError())

      expect(mockH.response).toHaveBeenCalledWith({
        errors: [
          {
            entity: 'Unknown',
            message: '"name" is required',
            property: 'name',
            value: ''
          },
          {
            entity: 'Unknown',
            message: '"age" must be a number',
            property: 'age',
            value: 'not-a-number'
          }
        ]
      })

      expect(mockH.takeover).toHaveBeenCalled()
    })

    it('should return the takeover response', () => {
      const mockH = getMockH()
      const result = failAction({}, mockH, getDefaultMockError())

      expect(result).toBe('takeover-result')
    })

    it('should handle empty error details gracefully', () => {
      const mockH = getMockH()
      const mockError = {
        details: []
      }

      failAction({}, mockH, mockError)

      expect(mockH.response).toHaveBeenCalledWith({ errors: [] })
    })

    it('should handle errors with no details', () => {
      const mockH = getMockH()
      const mockError = {}

      failAction({}, mockH, mockError)

      expect(mockH.response).toHaveBeenCalledWith({ errors: {} })
    })

    it('should handle missing label gracefully', () => {
      const mockH = getMockH()
      const mockError = {
        details: [
          {
            entity: 'Unknown',
            message: '"age" must be a number',
            context: {
              value: 'not-a-number'
            }
          }
        ]
      }

      failAction({}, mockH, mockError)

      expect(mockH.response).toHaveBeenCalledWith({
        errors: [
          {
            entity: 'Unknown',
            message: '"age" must be a number',
            property: undefined,
            value: 'not-a-number'
          }
        ]
      })
    })

    it('should handle missing value gracefully', () => {
      const mockH = getMockH()
      const mockError = {
        details: [
          {
            entity: 'Unknown',
            message: '"name" is required',
            context: {
              label: 'name'
            }
          }
        ]
      }

      failAction({}, mockH, mockError)

      expect(mockH.response).toHaveBeenCalledWith({
        errors: [
          {
            entity: 'Unknown',
            message: '"name" is required',
            property: 'name',
            value: undefined
          }
        ]
      })
    })

    it('should handle err.details that are undefined', () => {
      const mockH = getMockH()
      const mockError = {
        details: undefined
      }

      failAction({}, mockH, mockError)

      expect(mockH.response).toHaveBeenCalledWith({
        errors: {
          details: undefined
        }
      })
    })
  })
})
