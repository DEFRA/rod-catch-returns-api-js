import initialiseServer from '../server.js'

/** @type {import('@hapi/hapi').Server} */
let server

describe('server', () => {
  it('successfully starts the server', async () => {
    server = await initialiseServer()

    const result = await server.inject({ method: 'GET', url: '/' })
    expect(result.statusCode).toBe(404)

    await server.stop()
  })

  it('should start the server on the specified port', async () => {
    process.env.PORT = 5001;

    server = await initialiseServer()

    expect(server.info.port).toBe(5001)

    await server.stop()
  })
});
