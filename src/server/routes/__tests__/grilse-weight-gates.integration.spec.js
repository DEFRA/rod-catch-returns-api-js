import initialiseServer from '../../server.js'

describe('grilse-weight-gates.integration', () => {
  /** @type {import('@hapi/hapi').Server} */
  let server = null

  beforeAll(async () => {
    server = await initialiseServer({ port: null })
  })

  afterAll(async () => {
    await server.stop()
  })

  describe('GET /api/grilseWeightGates', () => {
    it('should return all grilse weight gates', async () => {
      const result = await server.inject({
        method: 'GET',
        url: '/api/grilseWeightGates'
      })

      expect(
        JSON.parse(result.payload)._embedded.grilseWeightGates
      ).toStrictEqual([
        {
          id: '1',
          name: 'Dee',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          _links: {
            self: {
              href: expect.stringMatching('/api/grilseWeightGates/1')
            },
            grilseWeightGate: {
              href: expect.stringMatching('/api/grilseWeightGates/1')
            },
            catchments: {
              href: expect.stringMatching('/api/grilseWeightGates/1/catchments')
            }
          }
        },
        {
          id: '2',
          name: 'Tamar',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          _links: {
            self: {
              href: expect.stringMatching('/api/grilseWeightGates/2')
            },
            grilseWeightGate: {
              href: expect.stringMatching('/api/grilseWeightGates/2')
            },
            catchments: {
              href: expect.stringMatching('/api/grilseWeightGates/2/catchments')
            }
          }
        }
      ])
      expect(result.statusCode).toBe(200)
    })
  })
})
