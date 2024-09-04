import initialiseServer from '../../server.js'

describe('static', () => {
  /** @type {import('@hapi/hapi').Server} */
  let server

  beforeAll(async () => {
    server = await initialiseServer()
  })

  afterAll(async () => {
    await server.stop()
  })

  it('has a link to the Swagger documentation', async () => {
    const result = await server.inject({ method: 'GET', url: '/' })

    expect(result.payload).toContain("<a href=\"documentation\">Swagger Documentation</a>")
  })

  it('has a link to the Swagger JSON file', async () => {
    const result = await server.inject({ method: 'GET', url: '/' })

    expect(result.payload).toContain("<a href=\"swagger.json\">Swagger JSON File</a>")
  })

})
