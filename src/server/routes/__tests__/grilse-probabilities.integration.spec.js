import fs from 'fs'
import initialiseServer from '../../server.js'
import path from 'path'

describe('grilse-probabilities.integration', () => {
  /** @type {import('@hapi/hapi').Server} */
  let server = null

  beforeAll(async () => {
    server = await initialiseServer()
  })

  afterAll(async () => {
    await server.stop()
  })

  describe('POST /reporting/reference/grilse-probabilities/{season}/{gate}', () => {
    it('should return 201 if the csv file is uploaded successfully', async () => {
      const filePath = path.join(__dirname, '__fixtures__', 'sample-data.csv')
      const fileBuffer = fs.readFileSync(filePath)

      const result = await server.inject({
        method: 'POST',
        url: '/reporting/reference/grilse-probabilities/2024/1',
        headers: {
          'Content-Type': 'text/csv'
        },
        payload: fileBuffer
      })

      expect(result.statusCode).toBe(201)
    })
  })
})
