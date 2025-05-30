import {
  createActivity,
  createSmallCatch,
  createSubmission
} from '../../../test-utils/server-test-utils.js'
import { createActivity as createActivityCRM } from '@defra-fish/dynamics-lib'
import { deleteSubmissionAndRelatedData } from '../../../test-utils/database-test-utils.js'
import { getCreateActivityResponse } from '../../../test-utils/test-data.js'
import { getMonthNameFromNumber } from '../../../utils/date-utils.js'
import initialiseServer from '../../server.js'

describe('small-catches.integration', () => {
  /** @type {import('@hapi/hapi').Server} */
  let server = null

  beforeAll(async () => {
    createActivityCRM.mockResolvedValue(getCreateActivityResponse())
    server = await initialiseServer({ port: null })
  })

  afterAll(async () => {
    await server.stop()
  })

  const setupSubmissionAndActivity = async (contactId) => {
    const submission = await createSubmission(server, contactId)
    const submissionId = JSON.parse(submission.payload).id
    const activity = await createActivity(server, submissionId)
    return JSON.parse(activity.payload).id
  }

  describe('POST /api/smallCatches ', () => {
    const CONTACT_IDENTIFIER_CREATE_SMALL_CATCH =
      'contact-identifier-create-small-catch'
    beforeEach(async () => {
      await deleteSubmissionAndRelatedData(
        CONTACT_IDENTIFIER_CREATE_SMALL_CATCH
      )
    })

    afterAll(
      async () =>
        await deleteSubmissionAndRelatedData(
          CONTACT_IDENTIFIER_CREATE_SMALL_CATCH
        )
    )

    it('should successfully create a small catch for a submission with a valid request', async () => {
      const activityId = await setupSubmissionAndActivity(
        CONTACT_IDENTIFIER_CREATE_SMALL_CATCH
      )

      const smallCatches = await createSmallCatch(server, activityId)

      const smallCatchesId = JSON.parse(smallCatches.payload).id
      expect(JSON.parse(smallCatches.payload)).toEqual({
        id: expect.any(String),
        month: 'FEBRUARY',
        counts: [
          {
            count: 3,
            _links: {
              method: {
                href: expect.stringMatching(`/api/methods/1`)
              }
            }
          },
          {
            count: 2,
            _links: {
              method: {
                href: expect.stringMatching(`/api/methods/2`)
              }
            }
          },
          {
            count: 1,
            _links: {
              method: {
                href: expect.stringMatching(`/api/methods/3`)
              }
            }
          }
        ],
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        version: expect.any(String),
        released: 3,
        reportingExclude: false,
        noMonthRecorded: false,
        _links: {
          self: {
            href: expect.stringMatching(`/api/smallCatches/${smallCatchesId}`)
          },
          smallCatch: {
            href: expect.stringMatching(`/api/smallCatches/${smallCatchesId}`)
          },
          activityEntity: {
            href: expect.stringMatching(`/api/activities/${activityId}`)
          },
          activity: {
            href: expect.stringMatching(
              `/api/smallCatches/${smallCatchesId}/activity`
            )
          }
        }
      })
      expect(smallCatches.statusCode).toBe(201)
    })

    it('should throw an error if a small catch with the same month has already been created', async () => {
      const activityId = await setupSubmissionAndActivity(
        CONTACT_IDENTIFIER_CREATE_SMALL_CATCH
      )

      const smallCatch1 = await createSmallCatch(server, activityId)

      expect(smallCatch1.statusCode).toBe(201)

      const smallCatch2 = await createSmallCatch(server, activityId)

      expect(smallCatch2.statusCode).toBe(400)
      expect(JSON.parse(smallCatch2.payload)).toEqual({
        errors: [
          {
            entity: 'SmallCatch',
            message: 'SMALL_CATCH_DUPLICATE_FOUND',
            property: 'month',
            value: 'FEBRUARY'
          }
        ]
      })
    })

    it('should throw an error if a small catch has the same method twice', async () => {
      const activityId = await setupSubmissionAndActivity(
        CONTACT_IDENTIFIER_CREATE_SMALL_CATCH
      )

      const smallCatch = await createSmallCatch(server, activityId, {
        counts: [
          {
            method: 'methods/1',
            count: '3'
          },
          {
            method: 'methods/1',
            count: '2'
          }
        ]
      })

      expect(JSON.parse(smallCatch.payload)).toEqual({
        errors: [
          {
            entity: 'SmallCatch',
            message: 'SMALL_CATCH_COUNTS_METHOD_DUPLICATE_FOUND',
            property: 'counts',
            value: [
              {
                method: 'methods/1',
                count: 3
              },
              {
                method: 'methods/1',
                count: 2
              }
            ]
          }
        ]
      })
      expect(smallCatch.statusCode).toBe(400)
    })

    it('should throw an error if a small catch released exceeds the count', async () => {
      const submission = await createSubmission(
        server,
        CONTACT_IDENTIFIER_CREATE_SMALL_CATCH
      )
      const submissionId = JSON.parse(submission.payload).id

      const activity = await createActivity(server, submissionId)
      const activityId = JSON.parse(activity.payload).id

      const smallCatch = await createSmallCatch(server, activityId, {
        released: 6,
        counts: [
          {
            method: 'methods/1',
            count: '3'
          },
          {
            method: 'methods/2',
            count: '2'
          }
        ]
      })

      expect(JSON.parse(smallCatch.payload)).toEqual({
        errors: [
          {
            entity: 'SmallCatch',
            message: 'SMALL_CATCH_RELEASED_EXCEEDS_COUNTS',
            property: 'released',
            value: 6
          }
        ]
      })
      expect(smallCatch.statusCode).toBe(400)
    })

    it('should throw an error when creating small catch with a method that is internal', async () => {
      const submission = await createSubmission(
        server,
        CONTACT_IDENTIFIER_CREATE_SMALL_CATCH
      )
      const submissionId = JSON.parse(submission.payload).id

      const activity = await createActivity(server, submissionId)
      const activityId = JSON.parse(activity.payload).id

      const smallCatch = await createSmallCatch(server, activityId, {
        released: 1,
        counts: [
          {
            method: 'methods/1',
            count: '3'
          },
          {
            method: 'methods/4', // methods/4 is internal
            count: '2'
          }
        ]
      })

      expect(JSON.parse(smallCatch.payload)).toEqual({
        errors: [
          {
            entity: 'SmallCatch',
            message: 'SMALL_CATCH_COUNTS_METHOD_FORBIDDEN',
            property: 'counts',
            value: [
              {
                method: 'methods/1',
                count: 3
              },
              {
                method: 'methods/4',
                count: 2
              }
            ]
          }
        ]
      })
      expect(smallCatch.statusCode).toBe(400)
    })

    it('should throw an error if small catch month is in the future', async () => {
      jest
        .useFakeTimers({ advanceTimers: true })
        .setSystemTime(new Date('2024-04-21')) // set month to April

      const submission = await createSubmission(
        server,
        CONTACT_IDENTIFIER_CREATE_SMALL_CATCH,
        {
          season: 2024
        }
      )
      const submissionId = JSON.parse(submission.payload).id

      const activity = await createActivity(server, submissionId)
      const activityId = JSON.parse(activity.payload).id

      const smallCatch = await createSmallCatch(server, activityId, {
        month: getMonthNameFromNumber(5) // set month to May
      })

      expect(JSON.parse(smallCatch.payload)).toEqual({
        errors: [
          {
            entity: 'SmallCatch',
            message: 'SMALL_CATCH_MONTH_IN_FUTURE',
            property: 'month',
            value: 'MAY'
          }
        ]
      })
      expect(smallCatch.statusCode).toBe(400)
      jest.useRealTimers()
    })
  })

  describe('GET /api/smallCatches/{smallCatchId}/activity', () => {
    const CONTACT_IDENTIFIER_GET_ACTIVITY_FOR_SMALL_CATCH =
      'contact-identifier-get-activity-for-small-catch'

    beforeEach(
      async () =>
        await deleteSubmissionAndRelatedData(
          CONTACT_IDENTIFIER_GET_ACTIVITY_FOR_SMALL_CATCH
        )
    )

    afterAll(
      async () =>
        await deleteSubmissionAndRelatedData(
          CONTACT_IDENTIFIER_GET_ACTIVITY_FOR_SMALL_CATCH
        )
    )

    it('should successfully get the activity associated with a small catch', async () => {
      const activityId = await setupSubmissionAndActivity(
        CONTACT_IDENTIFIER_GET_ACTIVITY_FOR_SMALL_CATCH
      )

      const smallCatch = await createSmallCatch(server, activityId)

      const smallCatchId = JSON.parse(smallCatch.payload).id

      const activity = await server.inject({
        method: 'GET',
        url: `/api/smallCatches/${smallCatchId}/activity`
      })

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
      expect(activity.statusCode).toBe(200)
    })

    it('should return a 404 and empty body if the activity could not be found', async () => {
      const result = await server.inject({
        method: 'GET',
        url: '/api/smallCatches/0/activity'
      })

      expect(result.statusCode).toBe(404)
      expect(result.payload).toBe('')
    })
  })

  describe('GET /api/smallCatches/{smallCatchId}', () => {
    const CONTACT_IDENTIFIER_GET_SMALL_CATCH =
      'contact-identifier-get-small-catch'
    beforeEach(
      async () =>
        await deleteSubmissionAndRelatedData(CONTACT_IDENTIFIER_GET_SMALL_CATCH)
    )

    afterAll(
      async () =>
        await deleteSubmissionAndRelatedData(CONTACT_IDENTIFIER_GET_SMALL_CATCH)
    )

    it('should return an a small catch if it exists', async () => {
      const activityId = await setupSubmissionAndActivity(
        CONTACT_IDENTIFIER_GET_SMALL_CATCH
      )

      const smallCatch = await createSmallCatch(server, activityId)

      const smallCatchId = JSON.parse(smallCatch.payload).id

      const result = await server.inject({
        method: 'GET',
        url: `/api/smallCatches/${smallCatchId}`
      })

      expect(JSON.parse(result.payload)).toStrictEqual({
        id: expect.any(String),
        month: 'FEBRUARY',
        counts: expect.arrayContaining([
          {
            count: 3,
            _links: {
              method: {
                href: expect.stringMatching(`/api/methods/1`)
              }
            }
          },
          {
            count: 2,
            _links: {
              method: {
                href: expect.stringMatching(`/api/methods/2`)
              }
            }
          },
          {
            count: 1,
            _links: {
              method: {
                href: expect.stringMatching(`/api/methods/3`)
              }
            }
          }
        ]),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        version: expect.any(String),
        released: 3,
        reportingExclude: false,
        noMonthRecorded: false,
        _links: {
          self: {
            href: expect.stringMatching(`/api/smallCatches/${smallCatchId}`)
          },
          smallCatch: {
            href: expect.stringMatching(`/api/smallCatches/${smallCatchId}`)
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
      })
      expect(result.statusCode).toBe(200)
    })

    it('should return a 404 and empty body if the small catch could not be found', async () => {
      const result = await server.inject({
        method: 'GET',
        url: '/api/smallCatches/0'
      })

      expect(result.statusCode).toBe(404)
      expect(result.payload).toBe('')
    })
  })

  describe('DELETE /api/smallCatches/{smallCatchId}', () => {
    const CONTACT_IDENTIFIER_DELETE_SMALL_CATCH =
      'contact-identifier-delete-small-catch'

    beforeEach(
      async () =>
        await deleteSubmissionAndRelatedData(
          CONTACT_IDENTIFIER_DELETE_SMALL_CATCH
        )
    )

    afterAll(
      async () =>
        await deleteSubmissionAndRelatedData(
          CONTACT_IDENTIFIER_DELETE_SMALL_CATCH
        )
    )

    it('should return a 204 and delete a small catch', async () => {
      const activityId = await setupSubmissionAndActivity(
        CONTACT_IDENTIFIER_DELETE_SMALL_CATCH
      )
      const createdSmallCatch = await createSmallCatch(server, activityId)
      const smallCatchId = JSON.parse(createdSmallCatch.payload).id

      // make sure small catch exists
      const foundSmallCatch = await server.inject({
        method: 'GET',
        url: `/api/smallCatches/${smallCatchId}`
      })
      expect(JSON.parse(foundSmallCatch.payload)).toStrictEqual({
        id: expect.any(String),
        month: 'FEBRUARY',
        counts: expect.arrayContaining([
          {
            count: 3,
            _links: {
              method: {
                href: expect.stringMatching(`/api/methods/1`)
              }
            }
          },
          {
            count: 2,
            _links: {
              method: {
                href: expect.stringMatching(`/api/methods/2`)
              }
            }
          },
          {
            count: 1,
            _links: {
              method: {
                href: expect.stringMatching(`/api/methods/3`)
              }
            }
          }
        ]),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        version: expect.any(String),
        released: 3,
        reportingExclude: false,
        noMonthRecorded: false,
        _links: {
          self: {
            href: expect.stringMatching(`/api/smallCatches/${smallCatchId}`)
          },
          smallCatch: {
            href: expect.stringMatching(`/api/smallCatches/${smallCatchId}`)
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
      })
      expect(foundSmallCatch.statusCode).toBe(200)

      // delete small catch
      const deletedSmallCatch = await server.inject({
        method: 'DELETE',
        url: `/api/smallCatches/${smallCatchId}`
      })
      expect(deletedSmallCatch.statusCode).toBe(204)
      expect(deletedSmallCatch.body).toBeUndefined()

      // make sure small catch has been deleted
      const foundSmallCatchAfterDelete = await server.inject({
        method: 'GET',
        url: `/api/smallCatches/${smallCatchId}`
      })
      expect(foundSmallCatchAfterDelete.statusCode).toBe(404)
    })

    it('should return a 404 and empty body if the small catch could not be deleted', async () => {
      const result = await server.inject({
        method: 'DELETE',
        url: '/api/smallCatches/0'
      })

      expect(result.statusCode).toBe(404)
      expect(result.payload).toBe('')
    })
  })

  describe('PATCH /api/smallCatches/{smallCatchId}', () => {
    const CONTACT_IDENTIFIER_UPDATE_SMALL_CATCH =
      'contact-identifier-update-small-catch'
    beforeEach(
      async () =>
        await deleteSubmissionAndRelatedData(
          CONTACT_IDENTIFIER_UPDATE_SMALL_CATCH
        )
    )

    afterAll(
      async () =>
        await deleteSubmissionAndRelatedData(
          CONTACT_IDENTIFIER_UPDATE_SMALL_CATCH
        )
    )

    test.each([
      {
        field: 'month',
        value: 'MARCH',
        expected: 'MARCH'
      },
      {
        field: 'released',
        value: '6',
        expected: 6
      },
      {
        field: 'noMonthRecorded',
        value: true,
        expected: true
      },
      {
        field: 'reportingExclude',
        value: true,
        expected: true
      }
    ])(
      'should successfully update a small catch with a valid $field',
      async ({ field, value, expected }) => {
        // Create submission, activity, and small catch
        const activityId = await setupSubmissionAndActivity(
          CONTACT_IDENTIFIER_UPDATE_SMALL_CATCH
        )
        const createdCatch = await createSmallCatch(server, activityId)
        const catchId = JSON.parse(createdCatch.payload).id

        // Update catch field
        const updatedSmallCatch = await server.inject({
          method: 'PATCH',
          url: `/api/smallCatches/${catchId}`,
          payload: {
            [field]: value
          }
        })
        expect(updatedSmallCatch.statusCode).toBe(200)

        // Verify field has been updated
        const foundUpdatedSmallCatch = await server.inject({
          method: 'GET',
          url: `/api/smallCatches/${catchId}`
        })
        const updatedPayload = JSON.parse(foundUpdatedSmallCatch.payload)
        expect(updatedPayload[field]).toBe(expected)
      }
    )

    it('should successfully update a small catch with a valid counts', async () => {
      // Create submission, activity, and small catch
      const activityId = await setupSubmissionAndActivity(
        CONTACT_IDENTIFIER_UPDATE_SMALL_CATCH
      )
      const createdCatch = await createSmallCatch(server, activityId)
      const catchId = JSON.parse(createdCatch.payload).id

      // Update catch field
      const updatedSmallCatch = await server.inject({
        method: 'PATCH',
        url: `/api/smallCatches/${catchId}`,
        payload: {
          counts: [
            { method: 'methods/1', count: 4 },
            { method: 'methods/2', count: 1 }
          ]
        }
      })
      expect(updatedSmallCatch.statusCode).toBe(200)

      // Verify field has been updated
      const foundUpdatedSmallCatch = await server.inject({
        method: 'GET',
        url: `/api/smallCatches/${catchId}`
      })
      const updatedPayload = JSON.parse(foundUpdatedSmallCatch.payload)
      expect(updatedPayload.counts).toStrictEqual([
        {
          count: 4,
          _links: {
            method: {
              href: expect.stringMatching(`/api/methods/1`)
            }
          }
        },
        {
          count: 1,
          _links: {
            method: {
              href: expect.stringMatching(`/api/methods/2`)
            }
          }
        }
      ])
    })

    it('should throw an error when updating small catch with a method that is internal', async () => {
      // Create submission, activity, and small catch
      const activityId = await setupSubmissionAndActivity(
        CONTACT_IDENTIFIER_UPDATE_SMALL_CATCH
      )
      const createdCatch = await createSmallCatch(server, activityId)
      const catchId = JSON.parse(createdCatch.payload).id

      // Update field
      const updatedSmallCatch = await server.inject({
        method: 'PATCH',
        url: `/api/smallCatches/${catchId}`,
        payload: {
          counts: [
            { method: 'methods/4', count: 3 },
            { method: 'methods/2', count: 1 }
          ]
        }
      })
      expect(JSON.parse(updatedSmallCatch.payload)).toEqual({
        errors: [
          {
            entity: 'SmallCatch',
            message: 'SMALL_CATCH_COUNTS_METHOD_FORBIDDEN',
            property: 'counts',
            value: [
              {
                method: 'methods/4',
                count: 3
              },
              {
                method: 'methods/2',
                count: 1
              }
            ]
          }
        ]
      })
      expect(updatedSmallCatch.statusCode).toBe(400)
    })
  })
})
