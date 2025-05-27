import { mapSubmissionToResponse } from '../submission.mapper.js'

describe('submission.mapper.unit', () => {
  describe('mapSubmissionToResponse', () => {
    const mockSubmission = {
      id: 1,
      contactId: 'contact-123',
      season: '2024',
      status: 'SUBMITTED',
      source: 'PAPER',
      version: '2024-10-10T13:13:11.000Z'
    }

    it('should map a submission to a response object with correct links', () => {
      const result = mapSubmissionToResponse(mockSubmission)

      expect(result).toEqual({
        id: 1,
        contactId: 'contact-123',
        season: '2024',
        status: 'SUBMITTED',
        source: 'PAPER',
        version: '2024-10-10T13:13:11.000Z',
        _links: {
          self: {
            href: 'http://localhost:5000/api/submissions/1'
          },
          submission: {
            href: 'http://localhost:5000/api/submissions/1'
          },
          activities: {
            href: 'http://localhost:5000/api/submissions/1/activities'
          }
        }
      })
    })
  })
})
