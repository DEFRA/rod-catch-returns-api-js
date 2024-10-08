import initialiseServer from '../../server.js'

describe('regions.integration', () => {
  /** @type {import('@hapi/hapi').Server} */
  let server = null

  beforeAll(async () => {
    server = await initialiseServer({ port: null })
  })

  afterAll(async () => {
    await server.stop()
  })

  describe('GET /api/regions', () => {
    it('should return all regions', async () => {
      const result = await server.inject({
        method: 'GET',
        url: '/api/regions'
      })

      expect(result.statusCode).toBe(200)
      expect(JSON.parse(result.payload)._embedded.regions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: 'Anglian',
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
          }),
          expect.objectContaining({
            id: expect.any(String),
            name: 'Midlands',
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
          })
        ])
      )
    })
  })
})
