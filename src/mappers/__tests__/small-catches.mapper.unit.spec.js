import {
  mapRequestToSmallCatch,
  mapSmallCatchCountToResponse,
  mapSmallCatchToResponse
} from '../small-catches.mapper.js'

describe('small-catches.mapper.unit', () => {
  const getMockRequest = () => ({
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
  })

  describe('mapSmallCatchToResponse', () => {
    it('should map a SmallCatch to a response object with correct links', () => {
      const mockSmallCatch = {
        id: '1',
        month: 2,
        released: 3,
        counts: [
          {
            count: 3,
            method_id: 1
          },
          {
            count: 2,
            method_id: 2
          },
          {
            count: 1,
            method_id: 3
          }
        ],
        activity_id: 3,
        noMonthRecorded: false,
        reportingExclude: false,
        createdAt: '2024-10-11T09:30:57.463+0000',
        updatedAt: '2024-10-11T09:30:57.463+0000',
        version: '2024-10-11T09:30:57.463+0000'
      }

      const result = mapSmallCatchToResponse(getMockRequest(), mockSmallCatch)

      expect(result).toMatchSnapshot()
    })
  })

  describe('mapSmallCatchCountToResponse', () => {
    it('should map a SmallCatchCount to a response object with correct links', () => {
      const mockSmallCatchCount = {
        count: 1,
        method_id: 3
      }

      const result = mapSmallCatchCountToResponse(
        getMockRequest(),
        mockSmallCatchCount
      )

      expect(result).toEqual({
        _links: { method: { href: 'http://localhost:3000/api/methods/3' } },
        count: 1
      })
    })
  })

  describe('mapRequestToSmallCatch', () => {
    it('should map a request to a SmallCatch', () => {
      const getMockRequestPayload = {
        submission: 'submissions/2802',
        activity: 'activities/3',
        month: 'FEBRUARY',
        released: '3',
        counts: [
          { method: 'methods/1', count: '3' },
          { method: 'methods/2', count: '2' },
          { method: 'methods/3', count: '1' }
        ],
        noMonthRecorded: false,
        reportingExclude: false
      }

      const result = mapRequestToSmallCatch(getMockRequestPayload)

      expect(result).toEqual({
        month: 2,
        released: '3',
        activity_id: '3',
        noMonthRecorded: false,
        reportingExclude: false,
        counts: [
          { count: '3', method_id: '1' },
          { count: '2', method_id: '2' },
          { count: '1', method_id: '3' }
        ],
        version: expect.any(Date)
      })
    })
  })
})
