import { Activity, Submission } from '../../../entities/index.js'
import initialiseServer from '../../server.js'

describe('activities.integration', () => {
  /** @type {import('@hapi/hapi').Server} */
  let server = null

  beforeAll(async () => {
    server = await initialiseServer({ port: null })
  })

  afterAll(async () => {
    await server.stop()
  })

  const deleteActivitiesAndSubmissions = async (contactId) => {
    const submission = await Submission.findOne({
      where: {
        contactId
      }
    })
    if (submission) {
      await Activity.destroy({
        where: { submission_id: submission.id }
      })
    }
    await Submission.destroy({
      where: {
        contactId
      }
    })
  }

  describe('POST /api/activities ', () => {
    const CONTACT_IDENTIFIER_CREATE_ACTIVITY =
      'contact-identifier-create-activity'
    beforeEach(() =>
      deleteActivitiesAndSubmissions(CONTACT_IDENTIFIER_CREATE_ACTIVITY)
    )

    afterAll(() =>
      deleteActivitiesAndSubmissions(CONTACT_IDENTIFIER_CREATE_ACTIVITY)
    )

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
        url: '/api/activities',
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
        id: expect.any(String),
        daysFishedWithMandatoryRelease: 20,
        daysFishedOther: 10,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        version: expect.any(String),
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
