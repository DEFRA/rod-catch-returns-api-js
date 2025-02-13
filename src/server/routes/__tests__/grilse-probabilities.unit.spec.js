import {
  deleteGrilseProbabilitiesForSeasonAndGate,
  isGrilseProbabilityExistsForSeasonAndGate,
  parseGrilseProbabilitiesCsv,
  processGrilseProbabilities
} from '../../../services/grilse-probabilities.service.js'
import {
  getMockResponseToolkit,
  getServerDetails
} from '../../../test-utils/server-test-utils.js'

import { GrilseProbability } from '../../../entities/index.js'
import { handleServerError } from '../../../utils/server-utils.js'
import routes from '../grilse-probabilities.js'

jest.mock('../../../services/grilse-probabilities.service.js')
jest.mock('../../../entities/index.js')
jest.mock('../../../utils/logger-utils.js')
jest.mock('../../../utils/server-utils.js')

const [
  {
    options: { handler: uploadGrilseProbabilitiesHandler }
  }
] = routes

const SERVER_ERROR_SYMBOL = Symbol('SERVER_ERROR')

handleServerError.mockReturnValue(SERVER_ERROR_SYMBOL)

describe('grilse-probabilities.unit', () => {
  describe('POST /reporting/reference/grilse-probabilities/{season}/{gate}', () => {
    const mockSeason = '2024'
    const mockGate = '1'
    const mockCsvData = 'Weight,January,February\n10,0.2,0.3\n15,0.5,0.6'
    const getMockRequest = ({ overwrite = 'false' } = {}) => ({
      params: { season: mockSeason, gate: mockGate },
      query: { overwrite },
      payload: Buffer.from(mockCsvData)
    })

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should return 201 amd create the records when the CSV is processed successfully', async () => {
      isGrilseProbabilityExistsForSeasonAndGate.mockResolvedValueOnce(false)
      parseGrilseProbabilitiesCsv.mockResolvedValueOnce([
        { Weight: '10', January: '0.2' }
      ])
      processGrilseProbabilities.mockReturnValueOnce([
        {
          season: mockSeason,
          gate_id: mockGate,
          massInPounds: 10,
          probability: 0.2,
          version: new Date()
        }
      ])
      GrilseProbability.bulkCreate.mockResolvedValueOnce()

      const result = await uploadGrilseProbabilitiesHandler(
        getServerDetails(getMockRequest()),
        getMockResponseToolkit()
      )

      expect(result.statusCode).toBe(201)
      expect(GrilseProbability.bulkCreate).toHaveBeenCalled()
    })

    it('should return 409 and an error message if existing data is found and overwrite is not set', async () => {
      isGrilseProbabilityExistsForSeasonAndGate.mockResolvedValueOnce(true)

      const result = await uploadGrilseProbabilitiesHandler(
        getServerDetails(getMockRequest({ overwrite: 'false' })),
        getMockResponseToolkit()
      )

      expect(result.statusCode).toBe(409)
      expect(result.payload).toStrictEqual({
        message:
          'Existing data found for the given season and gate but overwrite parameter not set'
      })
    })

    it('should delete existing data and create new if overwrite is set to true', async () => {
      isGrilseProbabilityExistsForSeasonAndGate.mockResolvedValueOnce(true)

      parseGrilseProbabilitiesCsv.mockResolvedValueOnce([
        { Weight: '10', January: '0.2' }
      ])
      processGrilseProbabilities.mockReturnValueOnce([
        {
          season: mockSeason,
          gate_id: mockGate,
          massInPounds: 10,
          probability: 0.2,
          version: new Date()
        }
      ])
      GrilseProbability.bulkCreate.mockResolvedValueOnce()

      await uploadGrilseProbabilitiesHandler(
        getServerDetails(getMockRequest({ overwrite: 'true' })),
        getMockResponseToolkit()
      )

      expect(deleteGrilseProbabilitiesForSeasonAndGate).toHaveBeenCalledWith(
        mockSeason,
        mockGate
      )
      expect(GrilseProbability.bulkCreate).toHaveBeenCalled()
    })

    it('should return a 201 and not create any records if there are no valid probabilities', async () => {
      isGrilseProbabilityExistsForSeasonAndGate.mockResolvedValueOnce(false)
      parseGrilseProbabilitiesCsv.mockResolvedValueOnce([
        { Weight: '10', January: '-0.2' }
      ])
      processGrilseProbabilities.mockReturnValueOnce([])

      const result = await uploadGrilseProbabilitiesHandler(
        getServerDetails(getMockRequest()),
        getMockResponseToolkit()
      )

      expect(result.statusCode).toBe(201)
      expect(GrilseProbability.bulkCreate).not.toHaveBeenCalled()
    })

    it('should handle errors gracefully and return server error response', async () => {
      const error = new Error('Database error')
      isGrilseProbabilityExistsForSeasonAndGate.mockRejectedValueOnce(error)

      const result = await uploadGrilseProbabilitiesHandler(
        getServerDetails(getMockRequest()),
        getMockResponseToolkit()
      )

      expect(handleServerError).toHaveBeenCalledWith(
        'Error uploading grilse probabilities file',
        error,
        expect.anything()
      )
      expect(result).toBe(SERVER_ERROR_SYMBOL)
    })

    it('should return a 400 error if the payload is neither a Buffer nor a string', async () => {
      const request = {
        params: { season: '2023', gate: '1' },
        query: { overwrite: 'true' },
        payload: { invalid: 'object' } // Object payload
      }

      const result = await uploadGrilseProbabilitiesHandler(
        getServerDetails(request),
        getMockResponseToolkit()
      )

      expect(result.statusCode).toBe(400)
    })
  })
})
