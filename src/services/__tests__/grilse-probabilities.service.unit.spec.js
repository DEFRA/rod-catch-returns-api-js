import {
  deleteGrilseProbabilitiesForSeasonAndGate,
  isGrilseProbabilityExistsForSeasonAndGate,
  parseGrilseProbabilitiesCsv,
  processGrilseProbabilities,
  validateCsvFile
} from '../grilse-probabilities.service.js'
import { GrilseProbability } from '../../entities/index.js'
import { GrilseValidationError } from '../../models/grilse-probability.model.js'
import { parse } from 'csv-parse'

jest.mock('../../entities/index.js')
jest.mock('csv-parse', () => ({
  parse: jest.fn()
}))

describe('grilse-probabilities.service.unit', () => {
  describe('isGrilseProbabilityExistsForSeasonAndGate', () => {
    const mockSeason = '2024'
    const mockGate = '1'

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return true if grilse probabilities exists', async () => {
      GrilseProbability.count.mockResolvedValue(1)

      const result = await isGrilseProbabilityExistsForSeasonAndGate(
        mockSeason,
        mockGate
      )

      expect(result).toBe(true)
    })

    it('should return false if grilse probabilities do not exist', async () => {
      GrilseProbability.count.mockResolvedValue(0)

      const result = await isGrilseProbabilityExistsForSeasonAndGate(
        mockSeason,
        mockGate
      )

      expect(result).toBe(false)
    })

    it('should handle errors thrown by GrilseProbability.count', async () => {
      GrilseProbability.count.mockRejectedValue(new Error('Database error'))

      await expect(
        isGrilseProbabilityExistsForSeasonAndGate(mockSeason, mockGate)
      ).rejects.toThrow('Database error')
    })
  })

  describe('deleteGrilseProbabilitiesForSeasonAndGate', () => {
    const mockSeason = 2024
    const mockGate = 1

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return the number of deleted records', async () => {
      GrilseProbability.destroy.mockResolvedValue(5)

      const result = await deleteGrilseProbabilitiesForSeasonAndGate(
        mockSeason,
        mockGate
      )

      expect(result).toBe(5)
      expect(GrilseProbability.destroy).toHaveBeenCalledWith({
        where: { season: mockSeason, gate_id: mockGate }
      })
    })

    it('should return 0 if no records are deleted', async () => {
      GrilseProbability.destroy.mockResolvedValue(0)

      const result = await deleteGrilseProbabilitiesForSeasonAndGate(
        mockSeason,
        mockGate
      )

      expect(result).toBe(0)
      expect(GrilseProbability.destroy).toHaveBeenCalledWith({
        where: { season: mockSeason, gate_id: mockGate }
      })
    })

    it('should handle errors thrown by GrilseProbability.destroy', async () => {
      GrilseProbability.destroy.mockRejectedValue(new Error('Database error'))

      await expect(
        deleteGrilseProbabilitiesForSeasonAndGate(mockSeason, mockGate)
      ).rejects.toThrow('Database error')
    })
  })

  describe('parseGrilseProbabilitiesCsv', () => {
    const mockCsvData = `Weight,January,February,March
10,0.2,0.3,0.1
15,0.5,0.6,0.4`

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should parse CSV data correctly', async () => {
      const mockParsedData = [
        { Weight: '10', January: '0.2', February: '0.3', March: '0.1' },
        { Weight: '15', January: '0.5', February: '0.6', March: '0.4' }
      ]

      parse.mockImplementation((data, options, callback) => {
        callback(null, mockParsedData)
      })

      const result = await parseGrilseProbabilitiesCsv(mockCsvData)

      expect(result).toEqual(mockParsedData)
    })

    it('should throw an error if CSV parsing fails', async () => {
      const mockError = new Error('CSV parsing error')

      parse.mockImplementation((data, options, callback) => {
        callback(mockError, null)
      })

      await expect(parseGrilseProbabilitiesCsv(mockCsvData)).rejects.toThrow(
        'CSV parsing error'
      )
    })
  })

  describe('processGrilseProbabilities', () => {
    const mockSeason = 2024
    const mockGate = 1

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should process records correctly and return valid probabilities', () => {
      const mockRecords = [
        { Weight: '10', January: '0.2', February: '0.0', March: '0.5' },
        { Weight: '15', January: '0.0', February: '0.6', March: '-0.1' }
      ]

      const result = processGrilseProbabilities(
        mockRecords,
        mockSeason,
        mockGate
      )

      expect(result).toEqual([
        {
          season: mockSeason,
          gate_id: mockGate,
          month: 1,
          massInPounds: 10,
          probability: 0.2,
          version: expect.any(Date)
        },
        {
          season: mockSeason,
          gate_id: mockGate,
          month: 3,
          massInPounds: 10,
          probability: 0.5,
          version: expect.any(Date)
        },
        {
          season: mockSeason,
          gate_id: mockGate,
          month: 2,
          massInPounds: 15,
          probability: 0.6,
          version: expect.any(Date)
        }
      ])
    })

    it('should return only return records which have a probability of more than 0', () => {
      const mockRecords = [
        { Weight: '10', January: '0.0', February: '-0.2', March: '-0.5' },
        { Weight: '15', January: '-0.1', February: '0.5', March: '0.0' }
      ]

      const result = processGrilseProbabilities(
        mockRecords,
        mockSeason,
        mockGate
      )

      expect(result).toEqual([
        {
          gate_id: 1,
          massInPounds: 15,
          month: 2,
          probability: 0.5,
          season: 2024,
          version: expect.any(Date)
        }
      ])
    })

    it('should return an empty array if an empty array is passed in', () => {
      const mockRecords = []

      const result = processGrilseProbabilities(
        mockRecords,
        mockSeason,
        mockGate
      )

      expect(result).toEqual([])
    })
  })

  describe('validateCsvFile', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it.each([
      ['object', { invalid: 'object' }],
      ['empty string', ''],
      ['only spaces', ' ']
    ])(
      'should throw "File is empty or not a valid csv." error if the request is a %s',
      (_, payload) => {
        expect(() => validateCsvFile(payload)).toThrow(
          new GrilseValidationError(
            422,
            'File is empty or not a valid csv.',
            []
          )
        )
      }
    )
  })
})
