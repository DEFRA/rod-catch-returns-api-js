import {
  createActivity,
  createSmallCatch,
  createSubmission
} from '../../../test-utils/server-test-utils.js'
import { deleteSubmissionAndRelatedData } from '../../../test-utils/database-test-utils.js'
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

  describe('POST /api/activities ', () => {
    const CONTACT_IDENTIFIER_CREATE_ACTIVITY =
      'contact-identifier-create-activity'
    beforeEach(() =>
      deleteSubmissionAndRelatedData(CONTACT_IDENTIFIER_CREATE_ACTIVITY)
    )

    afterAll(() =>
      deleteSubmissionAndRelatedData(CONTACT_IDENTIFIER_CREATE_ACTIVITY)
    )

    it('should successfully create a activity for a submission with a valid request', async () => {
      const submission = await createSubmission(
        server,
        CONTACT_IDENTIFIER_CREATE_ACTIVITY
      )
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
      const activityId = JSON.parse(activity.payload).id

      expect(JSON.parse(activity.payload)).toEqual({
        id: expect.any(String),
        daysFishedWithMandatoryRelease: 20,
        daysFishedOther: 10,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        version: expect.any(String),
        _links: {
          self: {
            href: expect.stringMatching(`/api/activities/${activityId}`)
          },
          activity: {
            href: expect.stringMatching(`/api/activities/${activityId}`)
          },
          submission: {
            href: expect.stringMatching(
              `/api/activities/${activityId}/submission`
            )
          },
          catches: {
            href: expect.stringMatching(`/api/activities/${activityId}/catches`)
          },
          river: {
            href: expect.stringMatching(`/api/activities/${activityId}/river`)
          },
          smallCatches: {
            href: expect.stringMatching(
              `/api/activities/${activityId}/smallCatches`
            )
          }
        }
      })
      expect(activity.statusCode).toBe(201)
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
      const submission = await createSubmission(
        server,
        CONTACT_IDENTIFIER_CREATE_ACTIVITY
      )
      const submissionId = JSON.parse(submission.payload).id

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
      const submission = await createSubmission(
        server,
        CONTACT_IDENTIFIER_CREATE_ACTIVITY
      )
      const submissionId = JSON.parse(submission.payload).id

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

  describe('GET /api/activities/{activityId}/river', () => {
    const CONTACT_IDENTIFIER_GET_ACTIVITY_RIVER =
      'contact-identifier-get-activity-river'
    beforeEach(() =>
      deleteSubmissionAndRelatedData(CONTACT_IDENTIFIER_GET_ACTIVITY_RIVER)
    )

    afterAll(() =>
      deleteSubmissionAndRelatedData(CONTACT_IDENTIFIER_GET_ACTIVITY_RIVER)
    )

    it('should return the river associated with an activity', async () => {
      const submission = await createSubmission(
        server,
        CONTACT_IDENTIFIER_GET_ACTIVITY_RIVER
      )
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
      const activityId = JSON.parse(activity.payload).id

      const result = await server.inject({
        method: 'GET',
        url: `/api/activities/${activityId}/river`
      })

      expect(result.statusCode).toBe(200)
      expect(JSON.parse(result.payload)).toEqual({
        createdAt: expect.any(String),
        id: '3',
        internal: false,
        name: 'Aeron',
        updatedAt: expect.any(String),
        _links: {
          self: {
            href: expect.stringMatching('/api/rivers/3')
          },
          river: {
            href: expect.stringMatching('/api/rivers/3')
          },
          catchment: {
            href: expect.stringMatching('/api/rivers/3/catchment')
          }
        }
      })
    })

    it('should return a 404 and empty body if the activity could not be found', async () => {
      const result = await server.inject({
        method: 'GET',
        url: '/api/activities/0/river'
      })

      expect(result.statusCode).toBe(404)
      expect(result.payload).toBe('')
    })
  })

  describe('GET /api/activities/{activityId}/smallCatches', () => {
    const CONTACT_IDENTIFIER_GET_ACTIVITY_SMALL_CATCHES =
      'contact-identifier-get-activity-small-catches'
    beforeEach(() =>
      deleteSubmissionAndRelatedData(
        CONTACT_IDENTIFIER_GET_ACTIVITY_SMALL_CATCHES
      )
    )

    afterAll(() =>
      deleteSubmissionAndRelatedData(
        CONTACT_IDENTIFIER_GET_ACTIVITY_SMALL_CATCHES
      )
    )

    it('should return the small catches associated with an activity', async () => {
      const submission = await createSubmission(
        server,
        CONTACT_IDENTIFIER_GET_ACTIVITY_SMALL_CATCHES
      )
      const submissionId = JSON.parse(submission.payload).id
      const activity = await createActivity(server, submissionId)
      const activityId = JSON.parse(activity.payload).id
      const smallCatch = await createSmallCatch(server, activityId, {
        counts: [
          {
            method: 'methods/1',
            count: '3'
          }
        ]
      })
      const smallCatchId = JSON.parse(smallCatch.payload).id

      const result = await server.inject({
        method: 'GET',
        url: `/api/activities/${activityId}/smallCatches`
      })

      expect(result.statusCode).toBe(200)
      expect(JSON.parse(result.payload)).toEqual({
        _embedded: {
          smallCatches: [
            {
              month: 'FEBRUARY',
              counts: [
                {
                  count: 3,
                  _links: {
                    method: {
                      href: expect.stringMatching('/api/methods/1')
                    }
                  }
                }
              ],
              released: 3,
              reportingExclude: false,
              noMonthRecorded: false,
              id: smallCatchId,
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              version: expect.any(String),
              _links: {
                self: {
                  href: expect.stringMatching(
                    `/api/smallCatches/${smallCatchId}`
                  )
                },
                smallCatch: {
                  href: expect.stringMatching(
                    `/api/smallCatches/${smallCatchId}`
                  )
                },
                activityEntity: {
                  href: expect.stringMatching(`/api/activities/${activityId}`)
                },
                activity: {
                  href: expect.stringMatching(
                    `/api/smallCatches/${smallCatchId}/activity`
                  )
                }
              }
            }
          ]
        }
      })
    })

    it('should return a 404 and empty body if the activity could not be found', async () => {
      const result = await server.inject({
        method: 'GET',
        url: '/api/activities/0/smallCatches'
      })

      expect(result.statusCode).toBe(404)
      expect(result.payload).toBe('')
    })
  })
})
