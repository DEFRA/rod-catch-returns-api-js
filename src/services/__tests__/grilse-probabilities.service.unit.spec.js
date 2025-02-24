import {
  deleteGrilseProbabilitiesForSeasonAndGate,
  isGrilseProbabilityExistsForSeasonAndGate,
  processGrilseProbabilities,
  validateAndParseCsvFile
} from '../grilse-probabilities.service.js'
import { GrilseProbability } from '../../entities/index.js'

jest.mock('../../entities/index.js')

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

  describe.skip('processGrilseProbabilities', () => {
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

  describe('validateAndParseCsvFile', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should return the data as a 2D array if it is valid', async () => {
      const payload = `Weight,June,July,August
1,1.0,1.0,1.0
2,1.0,1.0,1.0
      `

      await expect(validateAndParseCsvFile(payload)).resolves.toStrictEqual([
        ['Weight', 'June', 'July', 'August'],
        ['1', '1.0', '1.0', '1.0'],
        ['2', '1.0', '1.0', '1.0']
      ])
    })

    it.each([
      ['object', { invalid: 'object' }],
      ['empty string', ''],
      ['only spaces', ' '],
      ['empty buffer', Buffer.from('')]
    ])(
      'should throw "File is empty or not a valid csv." error if the request is a %s',
      async (_, payload) => {
        await expect(() =>
          validateAndParseCsvFile(payload)
        ).rejects.toMatchObject({
          status: 422,
          message: 'File is empty or not a valid csv.',
          error: 'Unprocessable Entity'
        })
      }
    )

    it('should return COLUMN_DISALLOWED if there is an invalid header', async () => {
      const payload = `Weight,June,July,Unknown
1,1.0,1.0,1.0
2,1.0,1.0,1.0
      `

      await expect(() =>
        validateAndParseCsvFile(payload)
      ).rejects.toMatchObject({
        status: 400,
        message: '400 BAD_REQUEST "Invalid CSV data"',
        errors: [{ errorType: 'COLUMN_DISALLOWED', row: 1, column: 4 }]
      })
    })

    it('should return MISSING_WEIGHT_HEADER if the weight column is missing', async () => {
      const payload = `Bob,June,July,August
1,1.0,1.0,1.0
2,1.0,1.0,1.0
      `

      await expect(() =>
        validateAndParseCsvFile(payload)
      ).rejects.toMatchObject({
        status: 400,
        message: '400 BAD_REQUEST "Invalid CSV data"',
        errors: [{ errorType: 'MISSING_WEIGHT_HEADER', row: 1, column: 1 }]
      })
    })

    it('should return DUPLICATE_HEADERS if a month is defined twice', async () => {
      const payload = `Weight,June,July,August,July
1,1.0,1.0,1.0,1.0
2,1.0,1.0,1.0,1.0
      `

      await expect(() =>
        validateAndParseCsvFile(payload)
      ).rejects.toMatchObject({
        status: 400,
        message: '400 BAD_REQUEST "Invalid CSV data"',
        errors: [{ errorType: 'DUPLICATE_HEADERS', row: 1, column: 5 }]
      })
    })
  })
})
