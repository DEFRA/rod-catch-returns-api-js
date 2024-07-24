import initialiseServer from '../server.js'

/** @type {import('@hapi/hapi').Server} */
let server

describe('server', () => {
  beforeAll(async () => {
    process.env.PORT = 5001
    server = await initialiseServer()
  })

  afterAll(async () => {
    await server.stop()
  })

  it('successfully starts the server', async () => {
    const result = await server.inject({ method: 'GET', url: '/' })
    expect(result.statusCode).toBe(404)
  })

  it('should start the server on the specified port', async () => {
    expect(server.info.port).toBe(5001)
  })
})
