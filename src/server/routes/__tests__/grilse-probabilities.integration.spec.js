import { GrilseProbability } from '../../../entities/index.js'
import fs from 'fs'
import initialiseServer from '../../server.js'
import path from 'path'

describe('grilse-probabilities.integration', () => {
  /** @type {import('@hapi/hapi').Server} */
  let server = null
  const season = 2024
  const gate = 1

  beforeAll(async () => {
    server = await initialiseServer()
  })

  afterAll(async () => {
    await server.stop()
  })

  const deleteGrilseProbabilitiesForSeasonAndGate = () => {
    return GrilseProbability.destroy({
      where: {
        season,
        gate_id: gate
      }
    })
  }

  const loadFile = (fileName) => {
    const filePath = path.join(__dirname, '__fixtures__', fileName)
    const fileBuffer = fs.readFileSync(filePath)
    return fileBuffer
  }

  describe('POST /api/reporting/reference/grilse-probabilities/{season}/{gate}', () => {
    beforeEach(async () => {
      await deleteGrilseProbabilitiesForSeasonAndGate(season, gate)
    })

    it('should return 201 if the csv file is uploaded successfully', async () => {
      const fileBuffer = loadFile('valid-grilse-data-69-datapoints.csv')

      const result = await server.inject({
        method: 'POST',
        url: '/api/reporting/reference/grilse-probabilities/2024/1',
        headers: {
          'Content-Type': 'text/csv'
        },
        payload: fileBuffer
      })

      expect(result.statusCode).toBe(201)
    })

    it('should return an error if an object is passed in instead of a file', async () => {
      const result = await server.inject({
        method: 'POST',
        url: '/api/reporting/reference/grilse-probabilities/2024/1',
        payload: { test: 'test' }
      })

      expect(JSON.parse(result.payload)).toStrictEqual({
        message: 'Invalid file format: expected a Buffer or string'
      })
      expect(result.statusCode).toBe(400)
    })

    it('should return an error if the data already exists in the database and ovewrite is false', async () => {
      const fileBuffer = loadFile('valid-grilse-data-69-datapoints.csv')

      const resultSuccess = await server.inject({
        method: 'POST',
        url: '/api/reporting/reference/grilse-probabilities/2024/1?overwrite=false',
        headers: {
          'Content-Type': 'text/csv'
        },
        payload: fileBuffer
      })
      expect(resultSuccess.statusCode).toBe(201)

      const resultError = await server.inject({
        method: 'POST',
        url: '/api/reporting/reference/grilse-probabilities/2024/1?overwrite=false',
        headers: {
          'Content-Type': 'text/csv'
        },
        payload: fileBuffer
      })
      expect(resultError.statusCode).toBe(409)
      expect(JSON.parse(resultError.payload)).toStrictEqual({
        message:
          'Existing data found for the given season and gate but overwrite parameter not set'
      })
    })

    it('should return 201 if the data has already been uploaded and overwrite is true', async () => {
      const fileBuffer = loadFile('valid-grilse-data-69-datapoints.csv')

      const result = await server.inject({
        method: 'POST',
        url: '/api/reporting/reference/grilse-probabilities/2024/1',
        headers: {
          'Content-Type': 'text/csv'
        },
        payload: fileBuffer
      })
      expect(result.statusCode).toBe(201)

      const resultOverwrite = await server.inject({
        method: 'POST',
        url: '/api/reporting/reference/grilse-probabilities/2024/1?overwrite=true',
        headers: {
          'Content-Type': 'text/csv'
        },
        payload: fileBuffer
      })
      expect(resultOverwrite.statusCode).toBe(201)
    })
  })
})
