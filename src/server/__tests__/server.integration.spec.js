import initialiseServer from '../server.js'

describe('server', () => {
  /** @type {import('@hapi/hapi').Server} */
  let server;

  afterEach(async () => {
    await server.stop();
    process.env.PORT = 5000
  });

  it('successfully starts the server', async () => {
    server = await initialiseServer();
    const result = await server.inject({ method: 'GET', url: '/' });
    expect(result.statusCode).toBe(404);
  });

  it('should start the server on the specified port', async () => {
    process.env.PORT = 5001;
    server = await initialiseServer();
    expect(server.info.port).toBe(5001);
  });
});