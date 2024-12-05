import initialiseServer from '../../server.js'

describe('species.integration', () => {
  /** @type {import('@hapi/hapi').Server} */
  let server = null

  beforeAll(async () => {
    server = await initialiseServer({ port: null })
  })

  afterAll(async () => {
    await server.stop()
  })

  describe('GET /api/species', () => {
    it('should return all species', async () => {
      const result = await server.inject({
        method: 'GET',
        url: '/api/species'
      })

      expect(result.statusCode).toBe(200)
      expect(JSON.parse(result.payload)._embedded.species).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            name: 'Salmon',
            smallCatchMass: 0.396893,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            _links: {
              self: {
                href: expect.stringMatching('/api/species/1')
              },
              species: {
                href: expect.stringMatching('/api/species/1')
              }
            }
          }),
          expect.objectContaining({
            id: '2',
            name: 'Sea Trout',
            smallCatchMass: 0.396893,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            _links: {
              self: {
                href: expect.stringMatching('/api/species/2')
              },
              species: {
                href: expect.stringMatching('/api/species/2')
              }
            }
          })
        ])
      )
    })
  })
})
