import { mapActivityToResponse } from '../activities.mapper.js'

describe('activities.mapper.unit', () => {
  describe('mapActivityToResponse', () => {
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

    const mockActivity = {
      id: 3,
      daysFishedWithMandatoryRelease: 1,
      daysFishedOther: 0,
      createdAt: '2024-10-10T13:26:30.344+0000',
      updatedAt: '2024-10-10T13:26:30.344+0000',
      version: 1
    }

    it('should map an Activity to a response object with correct links', () => {
      const result = mapActivityToResponse(mockRequest, mockActivity)

      expect(result).toEqual({
        id: 3,
        daysFishedWithMandatoryRelease: 1,
        daysFishedOther: 0,
        createdAt: '2024-10-10T13:26:30.344+0000',
        updatedAt: '2024-10-10T13:26:30.344+0000',
        version: 1,
        _links: {
          self: {
            href: 'http://localhost:3000/api/activities/3'
          },
          activity: {
            href: 'http://localhost:3000/api/activities/3'
          },
          submission: {
            href: 'http://localhost:3000/api/activities/3/submission'
          },
          catches: {
            href: 'http://localhost:3000/api/activities/3/catches'
          },
          river: {
            href: 'http://localhost:3000/api/activities/3/river'
          },
          smallCatches: {
            href: 'http://localhost:3000/api/activities/3/smallCatches'
          }
        }
      })
    })
  })
})
