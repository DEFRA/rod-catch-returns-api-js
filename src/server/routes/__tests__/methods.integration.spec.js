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
    id,
    internal,
    name,
    _links: {
      method: {
        href: expect.stringMatching(`api/methods/${id}`)
      },
      self: {
        href: expect.stringMatching(`api/methods/${id}`)
      }
    },
    createdAt: expect.any(String),
    updatedAt: expect.any(String)
  })

  describe('GET /api/methods', () => {
    it('should return all methods', async () => {
      const result = await server.inject({
        method: 'GET',
        url: '/api/methods'
      })

      expect(JSON.parse(result.payload)._embedded.methods).toStrictEqual([
        expectedMethod(false, 'Fly', '1'),
        expectedMethod(false, 'Spinner', '2'),
        expectedMethod(false, 'Bait', '3'),
        expectedMethod(true, 'Unknown', '4')
      ])
      expect(result.statusCode).toBe(200)
    })
  })

  describe('GET /api/methods/{methodId}', () => {
    it('should return a 200 the requested method if it exists', async () => {
      const result = await server.inject({
        method: 'GET',
        url: '/api/methods/3'
      })

      expect(JSON.parse(result.payload)).toEqual(
        expectedMethod(false, 'Bait', '3')
      )
      expect(result.statusCode).toBe(200)
    })

    it('should return a 404 and an empty body if the requested method does not exist', async () => {
      const result = await server.inject({
        method: 'GET',
        url: '/api/methods/5'
      })

      expect(result.payload).toBe('')
      expect(result.statusCode).toBe(404)
    })
  })
})
