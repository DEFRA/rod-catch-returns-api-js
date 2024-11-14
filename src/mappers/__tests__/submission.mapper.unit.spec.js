import { mapSubmissionToResponse } from '../submission.mapper.js'

describe('submission.mapper.unit', () => {
  describe('mapSubmissionToResponse', () => {
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

    const mockSubmission = {
      id: 1,
      contactId: 'contact-123',
      season: '2024',
      status: 'SUBMITTED',
      source: 'PAPER',
      version: '2024-10-10T13:13:11.000Z'
    }

    it('should map a submission to a response object with correct links', () => {
      const result = mapSubmissionToResponse(mockRequest, mockSubmission)

      expect(result).toEqual({
        id: 1,
        contactId: 'contact-123',
        season: '2024',
        status: 'SUBMITTED',
        source: 'PAPER',
        version: '2024-10-10T13:13:11.000Z',
        _links: {
          self: {
            href: 'http://localhost:3000/api/submissions/1'
          },
          submission: {
            href: 'http://localhost:3000/api/submissions/1'
          },
          activities: {
            href: 'http://localhost:3000/api/submissions/1/activities'
          }
        }
      })
    })
  })
})
