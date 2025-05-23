import {
  createActivity,
  createCatch,
  createSmallCatch,
  createSubmission
} from '../../../test-utils/server-test-utils.js'
import { createActivity as createActivityCRM } from '@defra-fish/dynamics-lib'
import { deleteSubmissionAndRelatedData } from '../../../test-utils/database-test-utils.js'
import { getCreateActivityResponse } from '../../../test-utils/test-data.js'
import initialiseServer from '../../server.js'

describe('activities.integration', () => {
  /** @type {import('@hapi/hapi').Server} */
  let server = null

  beforeAll(async () => {
    createActivityCRM.mockResolvedValue(getCreateActivityResponse())
    server = await initialiseServer({ port: null })
  })

  afterAll(async () => {
    await server.stop()
  })

  describe('POST /api/activities', () => {
    const CONTACT_IDENTIFIER_CREATE_ACTIVITY =
      'contact-identifier-create-activity'
    beforeEach(
      async () =>
        await deleteSubmissionAndRelatedData(CONTACT_IDENTIFIER_CREATE_ACTIVITY)
    )

    afterAll(
      async () =>
        await deleteSubmissionAndRelatedData(CONTACT_IDENTIFIER_CREATE_ACTIVITY)
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
            entity: 'Activity',
            message: 'ACTIVITY_SUBMISSION_NOT_FOUND',
            property: 'submission',
            value: 'submissions/0'
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
            entity: 'Activity',
            message: 'ACTIVITY_RIVER_FORBIDDEN',
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
            entity: 'Activity',
            message: 'ACTIVITY_RIVER_DUPLICATE_FOUND',
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
    beforeEach(
      async () =>
        await deleteSubmissionAndRelatedData(
          CONTACT_IDENTIFIER_GET_ACTIVITY_RIVER
        )
    )

    afterAll(
      async () =>
        await deleteSubmissionAndRelatedData(
          CONTACT_IDENTIFIER_GET_ACTIVITY_RIVER
        )
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
    beforeEach(
      async () =>
        await deleteSubmissionAndRelatedData(
          CONTACT_IDENTIFIER_GET_ACTIVITY_SMALL_CATCHES
        )
    )

    afterAll(
      async () =>
        await deleteSubmissionAndRelatedData(
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

  describe('GET /api/activities/{activityId}/catches', () => {
    const CONTACT_IDENTIFIER_GET_ACTIVITY_CATCHES =
      'contact-identifier-get-activity-catches'
    beforeEach(
      async () =>
        await deleteSubmissionAndRelatedData(
          CONTACT_IDENTIFIER_GET_ACTIVITY_CATCHES
        )
    )

    afterAll(
      async () =>
        await deleteSubmissionAndRelatedData(
          CONTACT_IDENTIFIER_GET_ACTIVITY_CATCHES
        )
    )

    it('should return the catches associated with an activity', async () => {
      const submission = await createSubmission(
        server,
        CONTACT_IDENTIFIER_GET_ACTIVITY_CATCHES
      )
      const submissionId = JSON.parse(submission.payload).id
      const activity = await createActivity(server, submissionId)
      const activityId = JSON.parse(activity.payload).id
      const createdCatch = await createCatch(server, activityId)
      const createdCatchId = JSON.parse(createdCatch.payload).id

      const result = await server.inject({
        method: 'GET',
        url: `/api/activities/${activityId}/catches`
      })

      expect(result.statusCode).toBe(200)
      expect(JSON.parse(result.payload)).toEqual({
        _embedded: {
          catches: [
            {
              id: expect.any(String),
              dateCaught: '2023-06-24',
              mass: {
                type: 'IMPERIAL',
                kg: 9.610488,
                oz: 339
              },
              released: true,
              reportingExclude: false,
              noDateRecorded: false,
              onlyMonthRecorded: false,
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              version: expect.any(String),
              _links: {
                self: {
                  href: expect.stringMatching(`/api/catches/${createdCatchId}`)
                },
                catch: {
                  href: expect.stringMatching(`/api/catches/${createdCatchId}`)
                },
                activityEntity: {
                  href: expect.stringMatching(`/api/activities/${activityId}`)
                },
                species: {
                  href: expect.stringMatching(
                    `/api/catches/${createdCatchId}/species`
                  )
                },
                method: {
                  href: expect.stringMatching(
                    `/api/catches/${createdCatchId}/method`
                  )
                },
                activity: {
                  href: expect.stringMatching(
                    `/api/catches/${createdCatchId}/activity`
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
        url: '/api/activities/0/catches'
      })

      expect(result.statusCode).toBe(404)
      expect(result.payload).toBe('')
    })
  })

  describe('GET /api/activities/{activityId}', () => {
    const CONTACT_IDENTIFIER_GET_ACTIVITY = 'contact-identifier-get-activity'
    beforeEach(
      async () =>
        await deleteSubmissionAndRelatedData(CONTACT_IDENTIFIER_GET_ACTIVITY)
    )

    afterAll(
      async () =>
        await deleteSubmissionAndRelatedData(CONTACT_IDENTIFIER_GET_ACTIVITY)
    )

    it('should return an activity if it exists', async () => {
      const submission = await createSubmission(
        server,
        CONTACT_IDENTIFIER_GET_ACTIVITY
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
        url: `/api/activities/${activityId}`
      })

      expect(result.statusCode).toBe(200)
      expect(JSON.parse(result.payload)).toEqual({
        id: activityId,
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
    })

    it('should return a 404 and empty body if the activity could not be found', async () => {
      const result = await server.inject({
        method: 'GET',
        url: '/api/activities/0'
      })

      expect(result.statusCode).toBe(404)
      expect(result.payload).toBe('')
    })
  })

  describe('DELETE /api/activities/{activityId}', () => {
    const CONTACT_IDENTIFIER_DELETE_ACTIVITY =
      'contact-identifier-delete-activity'
    beforeEach(
      async () =>
        await deleteSubmissionAndRelatedData(CONTACT_IDENTIFIER_DELETE_ACTIVITY)
    )

    afterAll(
      async () =>
        await deleteSubmissionAndRelatedData(CONTACT_IDENTIFIER_DELETE_ACTIVITY)
    )

    it('should return a 204 and delete an activity', async () => {
      const submission = await createSubmission(
        server,
        CONTACT_IDENTIFIER_DELETE_ACTIVITY
      )
      const submissionId = JSON.parse(submission.payload).id
      const activity = await createActivity(server, submissionId)
      const activityId = JSON.parse(activity.payload).id

      // make sure activity exists
      const foundActivity = await server.inject({
        method: 'GET',
        url: `/api/activities/${activityId}`
      })
      expect(foundActivity.statusCode).toBe(200)

      // delete activity
      const deletedActivity = await server.inject({
        method: 'DELETE',
        url: `/api/activities/${activityId}`
      })
      expect(deletedActivity.statusCode).toBe(204)
      expect(deletedActivity.body).toBeUndefined()

      // make sure activity has been deleted
      const foundActivityAfterDelete = await server.inject({
        method: 'GET',
        url: `/api/activities/${activityId}`
      })
      expect(foundActivityAfterDelete.statusCode).toBe(404)
    })

    it('should return a 204 and delete associated catches', async () => {
      const submission = await createSubmission(
        server,
        CONTACT_IDENTIFIER_DELETE_ACTIVITY
      )
      const submissionId = JSON.parse(submission.payload).id
      const activity = await createActivity(server, submissionId)
      const activityId = JSON.parse(activity.payload).id
      const createdCatch = await createCatch(server, activityId)
      const createdCatchId = JSON.parse(createdCatch.payload).id

      // make sure catch exists
      const foundCatch = await server.inject({
        method: 'GET',
        url: `/api/catches/${createdCatchId}`
      })
      expect(foundCatch.statusCode).toBe(200)

      await server.inject({
        method: 'DELETE',
        url: `/api/activities/${activityId}`
      })

      // make sure catch has been deleted
      const foundCatchAfterDelete = await server.inject({
        method: 'GET',
        url: `/api/catches/${createdCatchId}`
      })
      expect(foundCatchAfterDelete.statusCode).toBe(404)
    })

    it('should return a 204 and delete associated small catches', async () => {
      const submission = await createSubmission(
        server,
        CONTACT_IDENTIFIER_DELETE_ACTIVITY
      )
      const submissionId = JSON.parse(submission.payload).id
      const activity = await createActivity(server, submissionId)
      const activityId = JSON.parse(activity.payload).id
      const createdSmallCatch = await createSmallCatch(server, activityId)
      const createdSmallCatchId = JSON.parse(createdSmallCatch.payload).id

      // make sure small catch exists
      const foundSmallCatch = await server.inject({
        method: 'GET',
        url: `/api/smallCatches/${createdSmallCatchId}`
      })
      expect(foundSmallCatch.statusCode).toBe(200)

      await server.inject({
        method: 'DELETE',
        url: `/api/activities/${activityId}`
      })

      // make sure small catch has been deleted
      const foundSmallCatchAfterDelete = await server.inject({
        method: 'GET',
        url: `/api/catches/${createdSmallCatchId}`
      })
      expect(foundSmallCatchAfterDelete.statusCode).toBe(404)
    })

    it('should return a 404 and empty body if the activity could not be deleted', async () => {
      const result = await server.inject({
        method: 'DELETE',
        url: '/api/activities/0'
      })

      expect(result.statusCode).toBe(404)
      expect(result.payload).toBe('')
    })
  })

  describe('PATCH /api/activities/{activityId}', () => {
    const CONTACT_IDENTIFIER_UPDATE_ACTIVITY =
      'contact-identifier-update-activity'
    beforeEach(
      async () =>
        await deleteSubmissionAndRelatedData(CONTACT_IDENTIFIER_UPDATE_ACTIVITY)
    )

    afterAll(
      async () =>
        await deleteSubmissionAndRelatedData(CONTACT_IDENTIFIER_UPDATE_ACTIVITY)
    )

    it('should successfully update an activity with a valid daysFishedWithMandatoryRelease', async () => {
      // create submission and activity
      const submission = await createSubmission(
        server,
        CONTACT_IDENTIFIER_UPDATE_ACTIVITY
      )
      const submissionId = JSON.parse(submission.payload).id
      const createdActivity = await createActivity(server, submissionId)
      const createdActivityId = JSON.parse(createdActivity.payload).id
      expect(
        JSON.parse(createdActivity.payload).daysFishedWithMandatoryRelease
      ).toBe(20)

      // Update activity
      const updatedActivity = await server.inject({
        method: 'PATCH',
        url: `/api/activities/${createdActivityId}`,
        payload: {
          daysFishedWithMandatoryRelease: '5'
        }
      })
      expect(updatedActivity.statusCode).toBe(200)

      // check daysFishedWithMandatoryRelease in activity has been updated
      const foundApdatedSubmission = await server.inject({
        method: 'GET',
        url: `/api/activities/${createdActivityId}`
      })

      expect(
        JSON.parse(foundApdatedSubmission.payload)
          .daysFishedWithMandatoryRelease
      ).toBe(5)
    })

    it('should successfully update an activity with a valid daysFishedOther', async () => {
      // create submission and activity
      const submission = await createSubmission(
        server,
        CONTACT_IDENTIFIER_UPDATE_ACTIVITY
      )
      const submissionId = JSON.parse(submission.payload).id
      const createdActivity = await createActivity(server, submissionId)
      const createdActivityId = JSON.parse(createdActivity.payload).id
      expect(JSON.parse(createdActivity.payload).daysFishedOther).toBe(10)

      // Update activity
      const updatedActivity = await server.inject({
        method: 'PATCH',
        url: `/api/activities/${createdActivityId}`,
        payload: {
          daysFishedOther: '3'
        }
      })
      expect(updatedActivity.statusCode).toBe(200)

      // check daysFishedOther in activity has been updated
      const foundApdatedSubmission = await server.inject({
        method: 'GET',
        url: `/api/activities/${createdActivityId}`
      })

      expect(JSON.parse(foundApdatedSubmission.payload).daysFishedOther).toBe(3)
    })

    it('should successfully update an activity with a valid river', async () => {
      // create submission and activity
      const submission = await createSubmission(
        server,
        CONTACT_IDENTIFIER_UPDATE_ACTIVITY
      )
      const submissionId = JSON.parse(submission.payload).id
      const createdActivity = await createActivity(server, submissionId)
      const createdActivityId = JSON.parse(createdActivity.payload).id

      // Update activity
      await server.inject({
        method: 'PATCH',
        url: `/api/activities/${createdActivityId}`,
        payload: {
          river: 'rivers/12'
        }
      })

      // check daysFishedOther in activity has been updated
      const foundApdatedRiver = await server.inject({
        method: 'GET',
        url: `/api/activities/${createdActivityId}/river`
      })

      expect(JSON.parse(foundApdatedRiver.payload).id).toBe('12')
    })

    it('should throw an error if the river is already used in another activity', async () => {
      // create submission
      const submission = await createSubmission(
        server,
        CONTACT_IDENTIFIER_UPDATE_ACTIVITY
      )
      const submissionId = JSON.parse(submission.payload).id

      // create activity with rivers/1
      const createdActivity1 = await createActivity(server, submissionId)
      const createdActivityId1 = JSON.parse(createdActivity1.payload).id

      // create activity with rivers/2
      await createActivity(server, submissionId, {
        river: 'rivers/2'
      })

      // Update first activity with rivers/2 (which is already used in the second activity)
      const result = await server.inject({
        method: 'PATCH',
        url: `/api/activities/${createdActivityId1}`,
        payload: {
          river: 'rivers/2'
        }
      })

      expect(JSON.parse(result.payload)).toEqual({
        errors: [
          {
            entity: 'Activity',
            message: 'ACTIVITY_RIVER_DUPLICATE_FOUND',
            property: 'river',
            value: 'rivers/2'
          }
        ]
      })
    })

    it('should throw an error if the river does not exist', async () => {
      // create submission
      const submission = await createSubmission(
        server,
        CONTACT_IDENTIFIER_UPDATE_ACTIVITY
      )
      const submissionId = JSON.parse(submission.payload).id

      // create activity with valid river
      const createdActivity = await createActivity(server, submissionId)
      const createdActivityId = JSON.parse(createdActivity.payload).id

      // update with activity that does not exist
      const result = await server.inject({
        method: 'PATCH',
        url: `/api/activities/${createdActivityId}`,
        payload: {
          river: 'rivers/0'
        }
      })

      expect(JSON.parse(result.payload)).toEqual({
        errors: [
          {
            entity: 'Activity',
            message: 'ACTIVITY_RIVER_NOT_FOUND',
            property: 'river',
            value: 'rivers/0'
          }
        ]
      })
    })
  })

  describe('GET /api/activities/{activityId}/submission', () => {
    const CONTACT_IDENTIFIER_GET_ACTIVITY_SUBMISSION =
      'contact-identifier-get-activity-submission'
    beforeEach(
      async () =>
        await deleteSubmissionAndRelatedData(
          CONTACT_IDENTIFIER_GET_ACTIVITY_SUBMISSION
        )
    )

    afterAll(
      async () =>
        await deleteSubmissionAndRelatedData(
          CONTACT_IDENTIFIER_GET_ACTIVITY_SUBMISSION
        )
    )

    it('should return the submission associated with an activity', async () => {
      const submission = await createSubmission(
        server,
        CONTACT_IDENTIFIER_GET_ACTIVITY_SUBMISSION
      )
      const submissionId = JSON.parse(submission.payload).id

      const activity = await createActivity(server, submissionId)
      const activityId = JSON.parse(activity.payload).id

      const result = await server.inject({
        method: 'GET',
        url: `/api/activities/${activityId}/submission`
      })

      expect(JSON.parse(result.payload)).toEqual({
        id: expect.any(String),
        contactId: CONTACT_IDENTIFIER_GET_ACTIVITY_SUBMISSION,
        season: 2023,
        status: 'INCOMPLETE',
        source: 'WEB',
        reportingExclude: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        version: expect.any(String),
        _links: {
          activities: {
            href: expect.stringMatching(/\/api\/submissions\/\d+\/activities/)
          },
          self: {
            href: expect.stringMatching(/\/api\/submissions\/\d+/)
          },
          submission: {
            href: expect.stringMatching(/\/api\/submissions\/\d+/)
          }
        }
      })
      expect(result.statusCode).toBe(200)
    })

    it('should return a 404 and empty body if the activity could not be found', async () => {
      const result = await server.inject({
        method: 'GET',
        url: '/api/activities/0/submission'
      })

      expect(result.payload).toBe('')
      expect(result.statusCode).toBe(404)
    })
  })
})
