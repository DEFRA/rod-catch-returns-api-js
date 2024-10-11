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
            id: expect.any(String),
            name: 'Salmon',
            smallCatchMass : '0.396893',
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
          }),
          expect.objectContaining({
            id: expect.any(String),
            name: 'Sea Trout',
            smallCatchMass : '0.396893',
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
          })
        ])
      )
    })
  })
})
