import { mapSpeciesToResponse } from '../species.mapper.js'

describe('species.mapper.unit', () => {
  describe('mapCatchToResponse', () => {
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

    const mockSpeciesEnity = {
      id: '1',
      name: 'Salmon',
      smallCatchMass: '0.396893',
      createdAt: '2018-11-07T10:00:00.000Z',
      updatedAt: '2018-11-07T10:00:00.000Z'
    }

    it('should map a Catch entity to a response object with correct links', () => {
      const result = mapSpeciesToResponse(mockRequest, mockSpeciesEnity)

      expect(result).toStrictEqual({
        _links: {
          self: {
            href: 'http://localhost:3000/api/species/1'
          },
          species: {
            href: 'http://localhost:3000/api/species/1'
          }
        },
        createdAt: '2018-11-07T10:00:00.000Z',
        id: '1',
        name: 'Salmon',
        smallCatchMass: 0.396893,
        updatedAt: '2018-11-07T10:00:00.000Z'
      })
    })
  })
})
