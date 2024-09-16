// import { dynamicsClient } from '@defra-fish/dynamics-lib'
import initialiseServer from '../../server.js'

describe.skip('licences', () => {
  /** @type {import('@hapi/hapi').Server} */
  let server = null

  beforeAll(async () => {
    server = await initialiseServer({ port: null })
  })

  afterAll(async () => {
    await server.stop()
  })

  describe('GET /licence', () => {
    it('should return 200 if licence number and postcode are valid', async () => {
      const result = await server.inject({
        method: 'GET',
        url: '/licence/B7A111?verification=WA4 1HT'
      })

      expect(result.statusCode).toBe(200)
      expect(result.payload).toMatchObject({
        licenceNumber: 'B7A111',
        contact: {
          id: 'contact-identifier-111',
          postcode: 'WA4 1HT'
        }
      })
    })

    it('should return 403 if licence number is valid, but postcode is not', async () => {
      const result = await server.inject({
        method: 'GET',
        url: '/licence/B7A118?verification=WA4 1HT'
      })

      expect(result.statusCode).toBe(403)
    })

    it('should return 403 if licence and postcode are invalid', async () => {
      const result = await server.inject({
        method: 'GET',
        url: '/licence/notfound?verification=blah'
      })

      expect(result.statusCode).toBe(403)
    })

    it('should return 405 if attempting a POST request', async () => {
      const result = await server.inject({
        method: 'POST',
        url: '/licence/B7A111?verification=WA4 1HT'
      })

      expect(result.statusCode).toBe(403)
    })
  })
})
