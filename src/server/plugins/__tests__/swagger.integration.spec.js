import initialiseServer from '../../server.js'

describe('swagger.integration', () => {
  /** @type {import('@hapi/hapi').Server} */
  let server

  beforeAll(async () => {
    server = await initialiseServer()
  })

  afterAll(async () => {
    await server.stop()
  })

  it('exposes a swagger.json definition', async () => {
    const result = await server.inject({ method: 'GET', url: '/swagger.json' })

    expect(result).toMatchObject({
      statusCode: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8'
      },
      payload: expect.stringContaining('swagger')
    })
  })

  it('exposes the Swagger documentation UI', async () => {
    const result = await server.inject({ method: 'GET', url: '/documentation' })

    expect(result).toMatchObject({
      statusCode: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8'
      },
      payload: expect.stringContaining('swagger')
    })
  })
})
