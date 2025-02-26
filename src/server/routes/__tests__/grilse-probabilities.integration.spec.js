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

  const loadFixture = (fileName) => {
    const filePath = path.join(__dirname, '__fixtures__', fileName)
    const fileBuffer = fs.readFileSync(filePath)
    return fileBuffer
  }

  describe('POST /api/reporting/reference/grilse-probabilities/{season}/{gate}', () => {
    beforeEach(async () => {
      await deleteGrilseProbabilitiesForSeasonAndGate(season, gate)
    })

    it('should return 201 if the csv file is uploaded successfully', async () => {
      const fileBuffer = loadFixture('valid-grilse-data-69-datapoints.csv')

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

    it.only('should return 201 if the csv contains missing probabilities (should treat them as 0)', async () => {
      const fileBuffer = loadFixture(
        'missing-probabilities-treated-as-zeros.csv'
      )

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
        error: 'Unprocessable Entity',
        message: 'File is empty or not a valid csv.',
        path: '/api/reporting/reference/grilse-probabilities/2024/1',
        status: 422,
        timestamp: expect.any(String)
      })
      expect(result.statusCode).toBe(422)
    })

    it('should return an error if the data already exists in the database and ovewrite is false', async () => {
      const fileBuffer = loadFixture('valid-grilse-data-69-datapoints.csv')

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
      const fileBuffer = loadFixture('valid-grilse-data-69-datapoints.csv')

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

    it('should return an error if an invalid csv is passed in', async () => {
      const fileBuffer = loadFixture('invalid-csv.csv')

      const result = await server.inject({
        method: 'POST',
        url: '/api/reporting/reference/grilse-probabilities/2024/1',
        headers: {
          'Content-Type': 'text/csv'
        },
        payload: fileBuffer
      })

      expect(JSON.parse(result.payload)).toStrictEqual({
        error: 'Unprocessable Entity',
        message: 'File is empty or not a valid csv.',
        path: '/api/reporting/reference/grilse-probabilities/2024/1',
        status: 422,
        timestamp: expect.any(String)
      })
      expect(result.statusCode).toBe(422)
    })

    it.each([
      [
        'invalid column',
        'invalid-headers.csv',
        [{ column: 9, errorType: 'COLUMN_DISALLOWED', row: 1 }]
      ],
      [
        'duplicate columns',
        'duplicate-headers.csv',
        [
          { column: 3, errorType: 'DUPLICATE_HEADERS', row: 1 },
          { column: 6, errorType: 'DUPLICATE_HEADERS', row: 1 }
        ]
      ],
      [
        'missing weight column',
        'no-weight-heading.csv',
        [{ column: 1, errorType: 'MISSING_WEIGHT_HEADER', row: 1 }]
      ],
      [
        'missing months',
        'no-month-headings.csv',
        [{ column: 1, errorType: 'MISSING_MONTH_HEADER', row: 1 }]
      ],
      [
        'a row which has a length that does not match the length of the headings',
        'wrong-number-of-data-on-row.csv',
        [
          { errorType: 'ROW_HEADER_DISCREPANCY', row: 4, col: 8 },
          { errorType: 'ROW_HEADER_DISCREPANCY', row: 5, col: 9 }
        ]
      ],
      [
        'a weight that is not a whole number',
        'weight-not-whole-number.csv',
        [
          { errorType: 'NOT_WHOLE_NUMBER', row: 3, col: 1 },
          { errorType: 'NOT_WHOLE_NUMBER', row: 4, col: 1 }
        ]
      ],
      [
        'a weight that has been duplicated',
        'duplicate-weight.csv',
        [
          { errorType: 'DUPLICATE_WEIGHT', row: 4, col: 1 },
          { errorType: 'DUPLICATE_WEIGHT', row: 5, col: 1 }
        ]
      ],
      [
        'probabilities not between 0 and 1',
        'probability-not-between-0-and-1.csv',
        [
          { errorType: 'INVALID_PROBABILITY', row: 3, col: 2 },
          { errorType: 'INVALID_PROBABILITY', row: 4, col: 2 },
          { errorType: 'INVALID_PROBABILITY', row: 4, col: 8 },
          { errorType: 'INVALID_PROBABILITY', row: 5, col: 5 },
          { errorType: 'INVALID_PROBABILITY', row: 5, col: 8 }
        ]
      ],
      [
        'mixed errors',
        'probability-not-between-0-and-1.csv',
        [
          { errorType: 'DUPLICATE_WEIGHT', row: 4, col: 1 },
          { errorType: 'DUPLICATE_WEIGHT', row: 5, col: 1 },
          { errorType: 'INVALID_PROBABILITY', row: 6, col: 4 },
          { errorType: 'ROW_HEADER_DISCREPANCY', row: 7, col: 9 },
          { errorType: 'ROW_HEADER_DISCREPANCY', row: 8, col: 9 }
        ]
      ]
    ])(
      'should return an error if csv contains %s',
      async (_, fixture, expectedErrors) => {
        const fileBuffer = loadFixture(fixture)

        const result = await server.inject({
          method: 'POST',
          url: '/api/reporting/reference/grilse-probabilities/2024/1',
          headers: {
            'Content-Type': 'text/csv'
          },
          payload: fileBuffer
        })

        expect(JSON.parse(result.payload)).toStrictEqual({
          message: '400 BAD_REQUEST "Invalid CSV data"',
          path: '/api/reporting/reference/grilse-probabilities/2024/1',
          errors: expectedErrors,
          status: 400,
          timestamp: expect.any(String)
        })
        expect(result.statusCode).toBe(400)
      }
    )
  })
})
