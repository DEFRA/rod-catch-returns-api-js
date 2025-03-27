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

  describe('GET /api/profile', () => {
    it('should return a list of all the urls available in the api', async () => {
      const result = await server.inject({
        method: 'GET',
        url: '/api/profile'
      })

      expect(JSON.parse(result.payload)).toMatchSnapshot()
    })
  })
})
