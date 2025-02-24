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
        ['Weight', 'January', 'February', 'March'],
        ['10', '0.2', '0.0', '0.5'],
        ['15', '0.0', '0.6', '-0.1']
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
        ['Weight', 'January', 'February', 'March'],
        ['10', '0.0', '-0.2', '-0.5'],
        ['15', '-0.1', '0.5', '0.0']
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

    it('should throw an error if an array is not passed in', () => {
      const mockRecords = {}

      expect(() =>
        processGrilseProbabilities(mockRecords, mockSeason, mockGate)
      ).toThrowError(new Error('Invalid CSV data: input must be an array'))
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

    it.each([
      [
        'COLUMN_DISALLOWED if there is an invalid header',
        `Weight,June,July,Unknown
    1,1.0,1.0,1.0
    2,1.0,1.0,1.0
        `,
        [{ errorType: 'COLUMN_DISALLOWED', row: 1, column: 4 }]
      ],
      [
        'MISSING_WEIGHT_HEADER if the weight column is missing',
        `Bob,June,July,August
    1,1.0,1.0,1.0
    2,1.0,1.0,1.0
        `,
        [{ errorType: 'MISSING_WEIGHT_HEADER', row: 1, column: 1 }]
      ],
      [
        'DUPLICATE_HEADERS if a month is defined twice',
        `Weight,June,July,August,July
    1,1.0,1.0,1.0,1.0
    2,1.0,1.0,1.0,1.0
        `,
        [{ errorType: 'DUPLICATE_HEADERS', row: 1, column: 5 }]
      ],
      [
        'MISSING_MONTH_HEADER if the months are missing',
        `Weight
    1
    2
        `,
        [{ errorType: 'MISSING_MONTH_HEADER', row: 1, column: 1 }]
      ]
    ])('should return %s', async (_, payload, expectedErrors) => {
      await expect(() =>
        validateAndParseCsvFile(payload)
      ).rejects.toMatchObject({
        status: 400,
        message: '400 BAD_REQUEST "Invalid CSV data"',
        errors: expectedErrors
      })
    })
  })
})
