import initialiseServer from '../../server.js'

describe('methods.integration', () => {
  /** @type {import('@hapi/hapi').Server} */
  let server = null

  beforeAll(async () => {
    server = await initialiseServer()
  })

  afterAll(async () => {
    await server.stop()
  })

  const expectedMethod = (internal, name, id) => ({
    internal,
    name,
    _links: {
      method: {
        href: expect.stringMatching(`api/methods/${id}`)
      },
      self: {
        href: expect.stringMatching(`api/methods/${id}`)
      }
    }
  })

  describe('GET /api/methods', () => {
    it('should return all methods', async () => {
      const result = await server.inject({
        method: 'GET',
        url: '/api/methods'
      })

      expect(result.statusCode).toBe(200)
      expect(JSON.parse(result.payload)._embedded.methods).toEqual(
        expect.arrayContaining([
          expect.objectContaining(expectedMethod(false, 'Fly', 1)),
          expect.objectContaining(expectedMethod(false, 'Spinner', 2)),
          expect.objectContaining(expectedMethod(false, 'Bait', 3)),
          expect.objectContaining(expectedMethod(true, 'Unknown', 4))
        ])
      )
    })
  })
})
