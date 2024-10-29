import { deleteActivitiesAndSubmissions } from '../../../test-utils/database-test-utils.js'
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

  const createSubmission = async (contactId) => {
    const submission = await server.inject({
      method: 'POST',
      url: '/api/submissions',
      payload: {
        contactId,
        season: '2023',
        status: 'INCOMPLETE',
        source: 'WEB'
      }
    })
    const submissionId = JSON.parse(submission.payload).id
    return submissionId
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
      const submissionId = await createSubmission(
        CONTACT_IDENTIFIER_CREATE_ACTIVITY
      )
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

    it('should return a 400 status code and error if the submission does not exist', async () => {
      const activity = await server.inject({
        method: 'POST',
        url: '/api/activities',
        payload: {
          submission: 'submissions/0',
          daysFishedWithMandatoryRelease: '20',
          daysFishedOther: '10',
          river: 'rivers/3'
        }
      })

      expect(activity.statusCode).toBe(400)
      expect(JSON.parse(activity.payload)).toEqual({
        errors: [
          {
            message: 'The submission does not exist',
            property: 'submission',
            value: 'submissions/0'
          },
          {
            message: 'The submission does not exist',
            property: 'daysFishedWithMandatoryRelease',
            value: 20
          }
        ]
      })
    })

    it('should return a 400 status code and error if the river is internal', async () => {
      const submissionId = await createSubmission(
        CONTACT_IDENTIFIER_CREATE_ACTIVITY
      )
      const activity = await server.inject({
        method: 'POST',
        url: '/api/activities',
        payload: {
          submission: `submissions/${submissionId}`,
          daysFishedWithMandatoryRelease: '20',
          daysFishedOther: '10',
          river: 'rivers/229' // This river is internal (Unknown Anglian)
        }
      })

      expect(activity.statusCode).toBe(400)
      expect(JSON.parse(activity.payload)).toEqual({
        errors: [
          {
            message: 'This river is restricted',
            property: 'river',
            value: 'rivers/229'
          }
        ]
      })
    })

    it('should return a 400 status code and error if the river has already been added', async () => {
      const submissionId = await createSubmission(
        CONTACT_IDENTIFIER_CREATE_ACTIVITY
      )
      const activityPass = await server.inject({
        method: 'POST',
        url: '/api/activities',
        payload: {
          submission: `submissions/${submissionId}`,
          daysFishedWithMandatoryRelease: '20',
          daysFishedOther: '10',
          river: 'rivers/3'
        }
      })
      expect(activityPass.statusCode).toBe(201)

      const activityFail = await server.inject({
        method: 'POST',
        url: '/api/activities',
        payload: {
          submission: `submissions/${submissionId}`,
          daysFishedWithMandatoryRelease: '20',
          daysFishedOther: '10',
          river: 'rivers/3'
        }
      })
      expect(activityFail.statusCode).toBe(400)
      expect(JSON.parse(activityFail.payload)).toEqual({
        errors: [
          {
            message: 'River duplicate found',
            property: 'river',
            value: 'rivers/3'
          }
        ]
      })
    })
  })
})
