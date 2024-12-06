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
            id: '1',
            internal: false,
            name: 'Aber',
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            _links: {
              self: {
                href: expect.stringMatching('/api/rivers/1')
              },
              river: {
                href: expect.stringMatching('/api/rivers/1')
              },
              catchment: {
                href: expect.stringMatching('/api/rivers/1/catchment')
              }
            }
          }),
          expect.objectContaining({
            id: '229',
            internal: true,
            name: 'Unknown (Anglian)',
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            _links: {
              self: {
                href: expect.stringMatching('/api/rivers/229')
              },
              river: {
                href: expect.stringMatching('/api/rivers/229')
              },
              catchment: {
                href: expect.stringMatching('/api/rivers/229/catchment')
              }
            }
          })
        ])
      )
    })
  })
})
