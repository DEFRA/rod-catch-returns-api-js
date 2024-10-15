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

      expect(result).toHaveProperty('id', 1)
      expect(result).toHaveProperty('contactId', 'contact-123')
      expect(result).toHaveProperty('season', '2024')
      expect(result).toHaveProperty('status', 'SUBMITTED')
      expect(result).toHaveProperty('source', 'PAPER')
      expect(result).toHaveProperty('version', '2024-10-10T13:13:11.000Z')

      expect(result._links).toBeDefined()
      expect(result._links.self).toHaveProperty(
        'href',
        'http://localhost:3000/api/submissions/1'
      )
      expect(result._links.submission).toHaveProperty(
        'href',
        'http://localhost:3000/api/submissions/1'
      )
      expect(result._links.activities).toHaveProperty(
        'href',
        'http://localhost:3000/api/submissions/1/activities'
      )
    })
  })
})
