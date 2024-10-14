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
      version: 1696958452341,
      dataValues: {
        id: 1,
        contactId: 'contact-123',
        season: '2024',
        status: 'SUBMITTED',
        source: 'PAPER',
        version: 1696958452341
      }
    }

    it('should map a submission to a response object with correct links', () => {
      const result = mapSubmissionToResponse(mockRequest, mockSubmission)

      expect(result).toHaveProperty('id', mockSubmission.id)
      expect(result).toHaveProperty('contactId', mockSubmission.contactId)
      expect(result).toHaveProperty('season', mockSubmission.season)
      expect(result).toHaveProperty('status', mockSubmission.status)
      expect(result).toHaveProperty('source', mockSubmission.source)
      expect(result).toHaveProperty('version', mockSubmission.version)

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
