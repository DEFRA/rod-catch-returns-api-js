import initialiseServer from '../../server.js'

describe('catchments.integration', () => {
  /** @type {import('@hapi/hapi').Server} */
  let server = null

  beforeAll(async () => {
    server = await initialiseServer({ port: null })
  })

  afterAll(async () => {
    await server.stop()
  })

  describe('GET /api/catchments', () => {
    it('should return all catchments', async () => {
      const result = await server.inject({
        method: 'GET',
        url: '/api/catchments'
      })

      expect(result.statusCode).toBe(200)
      expect(JSON.parse(result.payload)._embedded.catchments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: 'Adur',
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
          }),
          expect.objectContaining({
            id: expect.any(String),
            name: 'Annas',
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
          })
        ])
      )
    })
  })
})
