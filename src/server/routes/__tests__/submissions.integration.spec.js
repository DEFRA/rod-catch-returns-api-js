import { CONTACT_IDENTIFIER } from '../../../test-utils/test-constants.js'
import { Submission } from '../../../entities/submission.entity.js'
import initialiseServer from '../../server.js'

describe('submissions.integration', () => {
  /** @type {import('@hapi/hapi').Server} */
  let server = null

  beforeAll(async () => {
    await Submission.destroy({
      where: {
        contactId: CONTACT_IDENTIFIER
      }
    })
    server = await initialiseServer({ port: null })
  })

  afterAll(async () => {
    await server.stop()
  })

  describe('POST /api/submissions ', () => {
    it('should successfully create a submission with a valid request', async () => {
      const result = await server.inject({
        method: 'POST',
        url: '/api/submissions',
        payload: {
          contactId: CONTACT_IDENTIFIER,
          season: '2023',
          status: 'INCOMPLETE',
          source: 'WEB'
        }
      })

      expect(result.statusCode).toBe(201)
      expect(JSON.parse(result.payload)).toEqual({
        id: expect.any(String),
        contactId: 'contact-identifier-111',
        season: 2023,
        status: 'INCOMPLETE',
        source: 'WEB',
        reportingExclude: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        version: expect.any(String)
      })
    })

    it('should return a 400 and error message if season is missing', async () => {
      const result = await server.inject({
        method: 'POST',
        url: '/api/submissions',
        payload: {
          contactId: CONTACT_IDENTIFIER,
          status: 'INCOMPLETE',
          source: 'WEB'
        }
      })

      expect(result.statusCode).toBe(400)
      expect(JSON.parse(result.payload)).toEqual({
        errors: [
          {
            message: '"season" is required',
            property: 'season',
            value: undefined
          }
        ]
      })
    })

    it('should return a 400 and error message season is invalid', async () => {
      const result = await server.inject({
        method: 'POST',
        url: '/api/submissions',
        payload: {
          contactId: CONTACT_IDENTIFIER,
          season: '20ab23',
          status: 'INCOMPLETE',
          source: 'WEB'
        }
      })

      expect(result.statusCode).toBe(400)
      expect(JSON.parse(result.payload)).toEqual({
        errors: [
          {
            message: '"season" must be a number',
            property: 'season',
            value: '20ab23'
          }
        ]
      })
    })

    it('should return a 400 and error message if status is missing', async () => {
      const result = await server.inject({
        method: 'POST',
        url: '/api/submissions',
        payload: {
          contactId: CONTACT_IDENTIFIER,
          season: '2023',
          source: 'WEB'
        }
      })

      expect(result.statusCode).toBe(400)
      expect(JSON.parse(result.payload)).toEqual({
        errors: [
          {
            message: '"status" is required',
            property: 'status',
            value: undefined
          }
        ]
      })
    })

    it('should return a 400 and error message status is invalid', async () => {
      const result = await server.inject({
        method: 'POST',
        url: '/api/submissions',
        payload: {
          contactId: CONTACT_IDENTIFIER,
          season: '2023',
          status: 'INVALID',
          source: 'WEB'
        }
      })

      expect(result.statusCode).toBe(400)
      expect(JSON.parse(result.payload)).toEqual({
        errors: [
          {
            message: '"status" must be one of [INCOMPLETE, SUBMITTED]',
            property: 'status',
            value: 'INVALID'
          }
        ]
      })
    })

    it('should return a 400 and error message if source is missing', async () => {
      const result = await server.inject({
        method: 'POST',
        url: '/api/submissions',
        payload: {
          contactId: CONTACT_IDENTIFIER,
          season: '2023',
          status: 'INCOMPLETE'
        }
      })

      expect(result.statusCode).toBe(400)
      expect(JSON.parse(result.payload)).toEqual({
        errors: [
          {
            message: '"source" is required',
            property: 'source',
            value: undefined
          }
        ]
      })
    })

    it('should return a 400 and error message source is invalid', async () => {
      const result = await server.inject({
        method: 'POST',
        url: '/api/submissions',
        payload: {
          contactId: CONTACT_IDENTIFIER,
          season: '2023',
          status: 'INCOMPLETE',
          source: 'INVALID'
        }
      })

      expect(result.statusCode).toBe(400)
      expect(JSON.parse(result.payload)).toEqual({
        errors: [
          {
            message: '"source" must be one of [WEB, PAPER]',
            property: 'source',
            value: 'INVALID'
          }
        ]
      })
    })
  })
})
