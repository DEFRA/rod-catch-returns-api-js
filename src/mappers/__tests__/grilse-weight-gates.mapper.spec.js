import { mapGrilseWeightGateToResponse } from '../grilse-weight-gates.mapper.js'

describe('grilse-weight-gates.mapper.mapper.unit', () => {
  describe('mapGrilseWeightGateToResponse', () => {
    const mockRequest = {
      url: {
        host: 'localhost:3000',
        protocol: 'http'
      },
      info: {
        host: 'localhost:3000'
      },
      server: {
        info: {
          protocol: 'http'
        }
      },
      headers: {
        'x-forwarded-proto': 'http'
      }
    }

    const mockGrilseWeightGate = {
      id: '2',
      name: 'Tamar',
      createdAt: '2018-11-07T10:00:00.000+0000',
      updatedAt: '2018-11-07T10:00:00.000+0000'
    }

    it('should map a grilse weight gate to a response object with correct links', () => {
      const result = mapGrilseWeightGateToResponse(
        mockRequest,
        mockGrilseWeightGate
      )

      expect(result).toEqual({
        id: '2',
        name: 'Tamar',
        createdAt: '2018-11-07T10:00:00.000+0000',
        updatedAt: '2018-11-07T10:00:00.000+0000',
        _links: {
          self: {
            href: 'http://localhost:3000/api/grilseWeightGates/2'
          },
          grilseWeightGate: {
            href: 'http://localhost:3000/api/grilseWeightGates/2'
          },
          catchments: {
            href: 'http://localhost:3000/api/grilseWeightGates/2/catchments'
          }
        }
      })
    })
  })
})
