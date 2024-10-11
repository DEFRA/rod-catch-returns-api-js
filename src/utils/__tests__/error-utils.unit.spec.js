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
  })
})
