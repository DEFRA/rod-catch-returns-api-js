import { failAction } from '../error-utils.js'

describe('error-utils.unit', () => {
  describe('failAction', () => {
    const getMockH = () => ({
      response: jest.fn().mockReturnThis(),
      code: jest.fn().mockReturnThis(),
      takeover: jest.fn().mockReturnValue('takeover-result')
    })
    const getDefaultMockError = () => ({
      details: [
        {
          message: '"name" is required',
          path: ['name']
        },
        {
          message: '"age" must be a number',
          path: ['age']
        }
      ],
      _original: {
        name: '',
        age: 'not-a-number'
      }
    })

    it('should format Joi validation errors correctly', () => {
      const mockH = getMockH()
      failAction({}, mockH, getDefaultMockError())

      expect(mockH.response).toHaveBeenCalledWith({
        errors: [
          {
            message: '"name" is required',
            property: 'name',
            value: ''
          },
          {
            message: '"age" must be a number',
            property: 'age',
            value: 'not-a-number'
          }
        ]
      })
    })

    it('should map Joi errors in the context correctly', () => {
      const mockH = getMockH()
      const mockError = {
        details: [
          {
            message: '"river" must be a valid URL',
            context: {
              path: 'river',
              value: 'rivers/21'
            }
          }
        ],
        _original: {
          river: 'invalid-url'
        }
      }

      failAction({}, mockH, mockError)

      expect(mockH.response).toHaveBeenCalledWith({
        errors: [
          {
            message: '"river" must be a valid URL',
            property: 'river',
            value: 'rivers/21'
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
            message: '"name" is required',
            property: 'name',
            value: ''
          },
          {
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
        details: [],
        _original: {}
      }

      failAction({}, mockH, mockError)

      expect(mockH.response).toHaveBeenCalledWith({ errors: [] })
    })

    it('should handle missing original value for properties', () => {
      const mockH = getMockH()
      const mockError = {
        details: [
          {
            message: '"age" is required',
            path: ['age']
          }
        ],
        _original: {}
      }

      failAction({}, mockH, mockError)

      expect(mockH.response).toHaveBeenCalledWith({
        errors: [
          {
            message: '"age" is required',
            property: 'age',
            value: undefined
          }
        ]
      })
    })

    it('should handle errors with no details', () => {
      const mockH = getMockH()
      const mockError = {
        _original: {
          name: 'John Doe'
        }
      }

      failAction({}, mockH, mockError)

      expect(mockH.response).toHaveBeenCalledWith({
        errors: {
          _original: {
            name: 'John Doe'
          }
        }
      })
    })

    it('should handle missing property context gracefully', () => {
      const mockH = getMockH()
      const mockError = {
        details: [
          {
            message: '"age" must be a number',
            path: ['age'],
            context: null
          }
        ],
        _original: {
          age: 'not-a-number'
        }
      }

      failAction({}, mockH, mockError)

      expect(mockH.response).toHaveBeenCalledWith({
        errors: [
          {
            message: '"age" must be a number',
            property: 'age',
            value: 'not-a-number'
          }
        ]
      })
    })

    it('should handle missing path gracefully', () => {
      const mockH = getMockH()
      const mockError = {
        details: [
          {
            message: '"age" must be a number',
            path: undefined
          }
        ],
        _original: {
          age: 'not-a-number'
        }
      }

      failAction({}, mockH, mockError)

      expect(mockH.response).toHaveBeenCalledWith({
        errors: [
          {
            message: '"age" must be a number',
            property: undefined,
            value: undefined
          }
        ]
      })
    })

    it('should handle missing original input gracefully', () => {
      const mockH = getMockH()
      const mockError = {
        details: [
          {
            message: '"name" is required',
            path: ['name']
          }
        ]
      }

      failAction({}, mockH, mockError)

      expect(mockH.response).toHaveBeenCalledWith({
        errors: [
          {
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
        details: undefined,
        _original: {
          age: 'not-a-number'
        }
      }

      failAction({}, mockH, mockError)

      expect(mockH.response).toHaveBeenCalledWith({
        errors: {
          details: undefined,
          _original: {
            age: 'not-a-number'
          }
        }
      })
    })

    it('should handle err.details where path is an empty array', () => {
      const mockH = getMockH()
      const mockError = {
        details: [
          {
            message: '"name" is required',
            path: []
          }
        ],
        _original: {
          name: ''
        }
      }

      failAction({}, mockH, mockError)

      expect(mockH.response).toHaveBeenCalledWith({
        errors: [
          {
            message: '"name" is required',
            property: undefined,
            value: undefined
          }
        ]
      })
    })
  })
})
