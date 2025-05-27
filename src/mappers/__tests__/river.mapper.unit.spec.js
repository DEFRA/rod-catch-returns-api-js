import { mapRiverToResponse } from '../river.mapper.js'

describe('river.mapper.unit', () => {
  describe('mapRiverToResponse', () => {
    const mockRiver = {
      id: 3,
      internal: false,
      name: 'river',
      createdAt: '2024-10-10T13:26:30.344+0000',
      updatedAt: '2024-10-10T13:26:30.344+0000',
      version: 1
    }

    it('should map a River to a response object with correct links', () => {
      const result = mapRiverToResponse(mockRiver)

      expect(result).toEqual({
        id: 3,
        internal: false,
        name: 'river',
        createdAt: '2024-10-10T13:26:30.344+0000',
        updatedAt: '2024-10-10T13:26:30.344+0000',
        version: 1,
        _links: {
          self: {
            href: 'http://localhost:5000/api/rivers/3'
          },
          river: {
            href: 'http://localhost:5000/api/rivers/3'
          },
          catchment: {
            href: 'http://localhost:5000/api/rivers/3/catchment'
          }
        }
      })
    })
  })
})
