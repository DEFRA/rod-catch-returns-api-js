import initialiseServer from '../server.js'

describe('server.integration', () => {
  /** @type {import('@hapi/hapi').Server} */
  let server
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = {
      ...originalEnv
    }
  })

  afterEach(async () => {
    await server.stop()
  })

  it('successfully starts the server', async () => {
    server = await initialiseServer()
    const result = await server.inject({ method: 'GET', url: '/' })
    expect(result.statusCode).toBe(200)
  })

  it('should start the server on the specified port', async () => {
    process.env.PORT = 5001
    server = await initialiseServer()
    expect(server.info.port).toBe(5001)
  })
})
