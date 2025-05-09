import { GrilseProbability, GrilseWeightGate } from '../../entities/index.js'
import {
  deleteGrilseProbabilitiesForSeasonAndGate,
  generateCsvFromGrilseProbabilities,
  getGrilseProbabilitiesBySeasonRange,
  isGrilseProbabilityExistsForSeasonAndGate,
  processGrilseProbabilities,
  validateAndParseCsvFile
} from '../grilse-probabilities.service.js'
import { Op } from 'sequelize'

jest.mock('../../entities/index.js')

describe('grilse-probabilities.service.unit', () => {
  describe('getGrilseProbabilitiesBySeasonRange', () => {
    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return grilse probabilities for the given season range', async () => {
      const mockData = [
        { season: 2024, month: 2, massInPounds: 4, probability: 0.7 },
        { season: 2023, month: 1, massInPounds: 2, probability: 0.5 }
      ]
      GrilseProbability.findAll.mockResolvedValue(mockData)

      const result = await getGrilseProbabilitiesBySeasonRange(2023, 2024)

      expect(result).toEqual(mockData)
    })

    it('should call findAll with the correct sorting and associations', async () => {
      const startSeason = 2023
      const endSeason = 2024
      const mockData = [
        { season: 2024, month: 2, massInPounds: 4, probability: 0.7 },
        { season: 2023, month: 1, massInPounds: 2, probability: 0.5 }
      ]
      GrilseProbability.findAll.mockResolvedValue(mockData)

      await getGrilseProbabilitiesBySeasonRange(startSeason, endSeason)

      expect(GrilseProbability.findAll).toHaveBeenCalledWith({
        where: { season: { [Op.between]: [startSeason, endSeason] } },
        include: {
          model: GrilseWeightGate,
          required: true
        },
        order: [
          ['season', 'DESC'],
          ['month', 'ASC'],
          ['massInPounds', 'ASC']
        ]
      })
    })

    it('should return an empty array if no records exist', async () => {
      GrilseProbability.findAll.mockResolvedValue([])

      const result = await getGrilseProbabilitiesBySeasonRange(2023, 2024)

      expect(result).toEqual([])
    })

    it('should throw an error if startSeason is missing', async () => {
      await expect(
        getGrilseProbabilitiesBySeasonRange(null, 2024)
      ).rejects.toThrow(
        'Invalid season range. Ensure startSeason is less than or equal to endSeason.'
      )
    })

    it('should throw an error if endSeason is missing', async () => {
      await expect(
        getGrilseProbabilitiesBySeasonRange(2023, null)
      ).rejects.toThrow(
        'Invalid season range. Ensure startSeason is less than or equal to endSeason.'
      )
    })

    it('should throw an error if startSeason is greater than endSeason', async () => {
      await expect(
        getGrilseProbabilitiesBySeasonRange(2025, 2023)
      ).rejects.toThrow(
        'Invalid season range. Ensure startSeason is less than or equal to endSeason.'
      )
    })

    it('should throw an error if the database query fails', async () => {
      GrilseProbability.findAll.mockRejectedValue(new Error('Database error'))

      await expect(
        getGrilseProbabilitiesBySeasonRange(2023, 2024)
      ).rejects.toThrow('Database error')
    })
  })

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

  describe('processGrilseProbabilities', () => {
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
        [{ errorType: 'COLUMN_DISALLOWED', row: 1, col: 4 }]
      ],
      [
        'MISSING_WEIGHT_HEADER if the weight column is missing',
        `Bob,June,July,August
    1,1.0,1.0,1.0
    2,1.0,1.0,1.0
        `,
        [{ errorType: 'MISSING_WEIGHT_HEADER', row: 1, col: 1 }]
      ],
      [
        'DUPLICATE_HEADERS if a month is defined twice',
        `Weight,June,July,August,July
    1,1.0,1.0,1.0,1.0
    2,1.0,1.0,1.0,1.0
        `,
        [{ errorType: 'DUPLICATE_HEADERS', row: 1, col: 5 }]
      ],
      [
        'MISSING_MONTH_HEADER if the months are missing',
        `Weight
    1
    2
        `,
        [{ errorType: 'MISSING_MONTH_HEADER', row: 1, col: 1 }]
      ],
      [
        'ROW_HEADER_DISCREPANCY if the number of fields in a row that does not match the number of headings',
        `Weight,June,July
    1,0.5,0.5,0.5
    2,0.5
        `,
        [
          { errorType: 'ROW_HEADER_DISCREPANCY', row: 2, col: 4 },
          { errorType: 'ROW_HEADER_DISCREPANCY', row: 3, col: 3 }
        ]
      ],
      [
        'NOT_WHOLE_NUMBER if any of the weights are not whole numbers',
        `Weight,June,July
    1.1,0.5,0.5
    2,0.5,0.5
        `,
        [{ errorType: 'NOT_WHOLE_NUMBER', row: 2, col: 1 }]
      ],
      [
        'DUPLICATE_WEIGHT if any of the weights duplicated',
        `Weight,June,July
    1,0.5,0.5
    2,0.5,0.5
    1,0.5,0.5
        `,
        [{ errorType: 'DUPLICATE_WEIGHT', row: 4, col: 1 }]
      ],
      [
        'INVALID_PROBABILITY if any of the probabilities are less than 0 or more than 1',
        `Weight,June,July
    1,1.5,0.5
    2,0.5,-0.5
        `,
        [
          { errorType: 'INVALID_PROBABILITY', row: 2, col: 2 },
          { errorType: 'INVALID_PROBABILITY', row: 3, col: 3 }
        ]
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

  describe('generateCsvFromGrilseProbabilities', () => {
    it('should generate a CSV from valid grilse probabilities', () => {
      const input = [
        {
          season: 2024,
          month: 6,
          massInPounds: 1,
          probability: '1.0000000000000000',
          GrilseWeightGate: { name: 'Dee' }
        },
        {
          season: 2024,
          month: 7,
          massInPounds: 2,
          probability: '0.5000000000000000',
          GrilseWeightGate: { name: 'Tamar' }
        }
      ]

      const expectedCsv = `Season,Gate,Month,Mass (lbs),Probability
2024,Dee,6,1,1.0000000000000000
2024,Tamar,7,2,0.5000000000000000`

      expect(generateCsvFromGrilseProbabilities(input)).toBe(expectedCsv)
    })

    it('should use "Unknown" for missing GrilseWeightGate', () => {
      const input = [
        {
          season: 2024,
          month: 6,
          massInPounds: 1,
          probability: '1.0000000000000000'
        }
      ]

      const expectedCsv = `Season,Gate,Month,Mass (lbs),Probability
2024,Unknown,6,1,1.0000000000000000`

      expect(generateCsvFromGrilseProbabilities(input)).toBe(expectedCsv)
    })

    it('should return only the header for an empty input array', () => {
      const expectedCsv = 'Season,Gate,Month,Mass (lbs),Probability'
      expect(generateCsvFromGrilseProbabilities([])).toBe(expectedCsv)
    })

    it('should handle large datasets correctly', () => {
      const input = Array.from({ length: 1000 }, (_, i) => ({
        season: 2024,
        month: (i % 12) + 1,
        massInPounds: (i % 10) + 1,
        probability: (1 - i / 1000).toFixed(16),
        GrilseWeightGate: { name: `Gate ${i % 5}` }
      }))

      const result = generateCsvFromGrilseProbabilities(input)
      const lines = result.split('\n')

      expect(lines.length).toBe(1001) // 1000 data rows + header
    })
  })
})
