import { mapMethodToResponse } from '../methods.mapper.js'

describe('methods.mapper.unit', () => {
  describe('mapMethodToResponse', () => {
    const mockMethod = {
      id: '2',
      internal: true,
      name: 'Unknown',
      createdAt: '2018-11-07T10:00:00.000+0000',
      updatedAt: '2018-11-07T10:00:00.000+0000'
    }

    it('should map a Method to a response object with correct links', () => {
      const result = mapMethodToResponse(mockMethod)

      expect(result).toEqual({
        id: '2',
        internal: true,
        name: 'Unknown',
        createdAt: '2018-11-07T10:00:00.000+0000',
        updatedAt: '2018-11-07T10:00:00.000+0000',
        _links: {
          method: {
            href: 'http://localhost:5000/api/methods/2'
          },
          self: {
            href: 'http://localhost:5000/api/methods/2'
          }
        }
      })
    })
  })
})
