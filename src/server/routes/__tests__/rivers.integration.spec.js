import initialiseServer from '../../server.js'

describe('rivers.integration', () => {
  /** @type {import('@hapi/hapi').Server} */
  let server = null

  beforeAll(async () => {
    server = await initialiseServer({ port: null })
  })

  afterAll(async () => {
    await server.stop()
  })

  describe('GET /api/rivers', () => {
    it('should return all rivers', async () => {
      const result = await server.inject({
        method: 'GET',
        url: '/api/rivers'
      })

      expect(result.statusCode).toBe(200)
      expect(JSON.parse(result.payload)._embedded.rivers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            internal: false,
            name: 'Aber',
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
          }),
          expect.objectContaining({
            id: expect.any(String),
            internal: true,
            name: 'Unknown (Anglian)',
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
          })
        ])
      )
    })
  })
})
