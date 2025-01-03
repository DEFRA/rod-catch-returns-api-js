import {
  calculateMass,
  mapCatchToResponse,
  mapRequestToCatch
} from '../catches.mapper.js'

describe('activity.mapper.unit', () => {
  describe('mapRequestToCatch', () => {
    const getMockCatchRequest = () => ({
      activity: 'activities/402',
      dateCaught: '2024-03-21T00:00:00+00:00',
      species: 'species/2',
      mass: {
        kg: 23,
        oz: 811,
        type: 'METRIC'
      },
      method: 'methods/1',
      released: false,
      onlyMonthRecorded: false,
      noDateRecorded: false,
      reportingExclude: false
    })

    it('should map a request object to a Catch entity', () => {
      const result = mapRequestToCatch(getMockCatchRequest())

      expect(result).toStrictEqual({
        activity_id: '402',
        dateCaught: '2024-03-21',
        massKg: 23,
        massOz: 811.301125,
        massType: 'METRIC',
        method_id: '1',
        noDateRecorded: false,
        onlyMonthRecorded: false,
        released: false,
        reportingExclude: false,
        species_id: '2',
        version: expect.any(Date)
      })
    })

    it('should map the mass correctly if mass type is METRIC', () => {
      const mockCatchRequest = getMockCatchRequest()

      const result = mapRequestToCatch(mockCatchRequest)

      expect(result).toStrictEqual(
        expect.objectContaining({
          massType: mockCatchRequest.mass.type,
          massKg: mockCatchRequest.mass.kg,
          massOz: 811.301125
        })
      )
    })

    it('should map the mass correctly if mass type is IMPERIAL', () => {
      const mockCatchRequest = {
        ...getMockCatchRequest(),
        mass: {
          kg: 9,
          oz: 333,
          type: 'IMPERIAL'
        }
      }

      const result = mapRequestToCatch(mockCatchRequest)

      expect(result).toStrictEqual(
        expect.objectContaining({
          massType: mockCatchRequest.mass.type,
          massKg: 9.440391,
          massOz: mockCatchRequest.mass.oz
        })
      )
    })

    it('should map the date caught correctly if it is provided in UTC format', () => {
      const result = mapRequestToCatch(getMockCatchRequest())

      expect(result.dateCaught).toBe('2024-03-21')
    })

    it('should map the date caught correctly if it is provided in UTC+1 format', () => {
      const result = mapRequestToCatch({
        ...getMockCatchRequest(),
        dateCaught: '2024-03-21T00:00:00+01:00'
      })

      expect(result.dateCaught).toBe('2024-03-21')
    })

    it.each([
      ['activity', 'activities/402', 'activity_id', '402'],
      ['species', 'species/2', 'species_id', '2'],
      ['method', 'methods/1', 'method_id', '1']
    ])(
      'should extract %s ID correctly',
      (key, value, expectedKey, expectedId) => {
        const mockCatchRequest = {
          ...getMockCatchRequest(),
          [key]: value
        }
        const result = mapRequestToCatch(mockCatchRequest)

        expect(result).toHaveProperty(expectedKey, expectedId)
      }
    )

    it.each([
      'dateCaught',
      'species',
      'mass',
      'method',
      'released',
      'onlyMonthRecorded',
      'noDateRecorded'
    ])('should handle missing %s field gracefully', (field) => {
      const mockCatchRequest = { ...getMockCatchRequest(), [field]: undefined }
      const result = mapRequestToCatch(mockCatchRequest)

      expect(result).not.toHaveProperty(field)
    })
  })

  describe('mapCatchToResponse', () => {
    const mockRequest = {
      url: {
        host: 'localhost:3000',
        protocol: 'http'
      },
      info: {
        host: 'localhost:3000'
      },
      server: {
        info: {
          protocol: 'http'
        }
      },
      headers: {
        'x-forwarded-proto': 'http'
      }
    }

    const mockCatchEnity = {
      id: '1600',
      activity_id: '404',
      dateCaught: '2024-06-24',
      species_id: '1',
      massType: 'IMPERIAL',
      massOz: '339.000000',
      massKg: '9.610488',
      method_id: '1',
      released: true,
      onlyMonthRecorded: false,
      noDateRecorded: false,
      reportingExclude: false,
      version: '2024-11-18T11:22:36.437Z',
      updatedAt: '2024-11-18T11:22:36.438Z',
      createdAt: '2024-11-18T11:22:36.438Z',
      ActivityId: '404'
    }

    it('should map a Catch entity to a response object with correct links', () => {
      const result = mapCatchToResponse(mockRequest, mockCatchEnity)

      expect(result).toStrictEqual({
        createdAt: '2024-11-18T11:22:36.438Z',
        dateCaught: '2024-06-24',
        id: '1600',
        mass: {
          kg: 9.610488,
          oz: 339,
          type: 'IMPERIAL'
        },
        noDateRecorded: false,
        onlyMonthRecorded: false,
        released: true,
        reportingExclude: false,
        updatedAt: '2024-11-18T11:22:36.438Z',
        version: '2024-11-18T11:22:36.437Z',
        _links: {
          activity: {
            href: 'http://localhost:3000/api/catches/1600/activity'
          },
          activityEntity: {
            href: 'http://localhost:3000/api/activities/404'
          },
          catch: {
            href: 'http://localhost:3000/api/catches/1600'
          },
          method: {
            href: 'http://localhost:3000/api/catches/1600/method'
          },
          self: {
            href: 'http://localhost:3000/api/catches/1600'
          },
          species: {
            href: 'http://localhost:3000/api/catches/1600/species'
          }
        }
      })
    })
  })

  describe('calculateMass', () => {
    it('should correctly calculate mass when type is METRIC and only kilograms are provided', () => {
      const result = calculateMass({ kg: 10, type: 'METRIC' })

      // 10/0.028349523125 = 352.739619496
      expect(result).toStrictEqual({
        massKg: 10,
        massOz: 352.739619
      })
    })

    it('should correctly calculate mass when type is IMPERIAL and only ounces are provided', () => {
      const result = calculateMass({ oz: 100, type: 'IMPERIAL' })

      // 100 * 0.028349523125 = 2.834952312
      expect(result).toStrictEqual({
        massKg: 2.834952,
        massOz: 100
      })
    })

    it('should throw an error if mass type is not provided', () => {
      expect(() => calculateMass({ kg: 10 })).toThrowError(
        'Mass type must be either IMPERIAL or METRIC'
      )
    })

    it('should throw an error if mass type is invalid', () => {
      expect(() => calculateMass({ kg: 10, type: 'INVALID' })).toThrowError(
        'Mass type must be either IMPERIAL or METRIC'
      )
    })

    it('should handle cases where both kg and oz are provided for METRIC type', () => {
      const result = calculateMass({ kg: 5, oz: 100, type: 'METRIC' })

      // 5/0.028349523125=176.369809748
      expect(result).toStrictEqual({
        massKg: 5,
        massOz: 176.36981
      })
    })

    it('should handle cases where both kg and oz are provided for IMPERIAL type', () => {
      const result = calculateMass({ kg: 5, oz: 100, type: 'IMPERIAL' })

      // 100 * 0.028349523125 = 2.834952312
      expect(result).toStrictEqual({
        massKg: 2.834952,
        massOz: 100
      })
    })

    it('should default kg and oz to 0 if not provided and type is METRIC', () => {
      const result = calculateMass({ type: 'METRIC' })

      expect(result).toStrictEqual({
        massKg: 0,
        massOz: 0
      })
    })

    it('should default kg and oz to 0 if not provided and type is IMPERIAL', () => {
      const result = calculateMass({ type: 'IMPERIAL' })

      expect(result).toStrictEqual({
        massKg: 0,
        massOz: 0
      })
    })

    it('should handle fractional values for kg and oz correctly for METRIC type', () => {
      const result = calculateMass({ kg: 2.5, type: 'METRIC' })

      // 2.5 / 0.028349523125 = 88.184904874
      expect(result).toStrictEqual({
        massKg: 2.5,
        massOz: 88.184905
      })
    })

    it('should handle fractional values for kg and oz correctly for IMPERIAL type', () => {
      const result = calculateMass({ oz: 50.5, type: 'IMPERIAL' })

      // 50.5 * 0.028349523125 = 1.431650918
      expect(result).toStrictEqual({
        massKg: 1.431651,
        massOz: 50.5
      })
    })
  })
})
