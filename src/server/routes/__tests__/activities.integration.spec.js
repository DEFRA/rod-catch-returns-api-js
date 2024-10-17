import { Submission } from '../../../entities/submission.entity.js'
import initialiseServer from '../../server.js'

describe.skip('activities.integration', () => {
  /** @type {import('@hapi/hapi').Server} */
  let server = null

  beforeAll(async () => {
    server = await initialiseServer({ port: null })
  })

  afterAll(async () => {
    await server.stop()
  })

  describe('POST /api/activities ', () => {
    const CONTACT_IDENTIFIER_CREATE_ACTIVITY =
      'contact-identifier-create-activity'
    beforeEach(async () => {
      await Submission.destroy({
        where: {
          contactId: CONTACT_IDENTIFIER_CREATE_ACTIVITY
        }
      })
    })

    afterAll(async () => {
      await Submission.destroy({
        where: {
          contactId: CONTACT_IDENTIFIER_CREATE_ACTIVITY
        }
      })
    })

    it('should successfully create a activity for a submission with a valid request', async () => {
      const submission = await server.inject({
        method: 'POST',
        url: '/api/submissions',
        payload: {
          contactId: CONTACT_IDENTIFIER_CREATE_ACTIVITY,
          season: '2023',
          status: 'INCOMPLETE',
          source: 'WEB'
        }
      })

      const submissionId = JSON.parse(submission.payload).id

      const activity = await server.inject({
        method: 'POST',
        url: '/api/submissions',
        payload: {
          submission: `submissions/${submissionId}`,
          daysFishedWithMandatoryRelease: '20',
          daysFishedOther: '10',
          river: 'rivers/3'
        }
      })

      const activitiyId = JSON.parse(activity.payload).id
      expect(activity.statusCode).toBe(201)
      expect(JSON.parse(activity.payload)).toEqual({
        daysFishedWithMandatoryRelease: 1,
        daysFishedOther: 0,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        _links: {
          self: {
            href: expect.stringMatching(`/api/activities/${activitiyId}`)
          },
          activity: {
            href: expect.stringMatching(`/api/activities/${activitiyId}`)
          },
          submission: {
            href: expect.stringMatching(
              `/api/activities/${activitiyId}/submission`
            )
          },
          catches: {
            href: expect.stringMatching(
              `/api/activities/${activitiyId}/catches`
            )
          },
          river: {
            href: expect.stringMatching(`/api/activities/${activitiyId}/river`)
          },
          smallCatches: {
            href: expect.stringMatching(
              `/api/activities/${activitiyId}/smallCatches`
            )
          }
        }
      })
    })
  })
})
