import {
  createActivity,
  createSmallCatch,
  createSubmission
} from '../../../test-utils/server-test-utils.js'
import { deleteSubmissionAndRelatedData } from '../../../test-utils/database-test-utils.js'
import { getMonthNameFromNumber } from '../../../utils/date-utils.js'
import initialiseServer from '../../server.js'

describe('small-catches.integration', () => {
  /** @type {import('@hapi/hapi').Server} */
  let server = null

  const mockCurrentDate = new Date()
  const currentYear = mockCurrentDate.getFullYear()
  const currentMonth = mockCurrentDate.getMonth() + 1

  beforeAll(async () => {
    server = await initialiseServer({ port: null })
  })

  afterAll(async () => {
    await server.stop()
  })

  describe('POST /api/smallCatches ', () => {
    const CONTACT_IDENTIFIER_CREATE_SMALL_CATCH =
      'contact-identifier-create-small-catch'
    beforeEach(
      async () =>
        await deleteSubmissionAndRelatedData(
          CONTACT_IDENTIFIER_CREATE_SMALL_CATCH
        )
    )

    afterAll(
      async () =>
        await deleteSubmissionAndRelatedData(
          CONTACT_IDENTIFIER_CREATE_SMALL_CATCH
        )
    )

    it('should successfully create a activity for a submission with a valid request', async () => {
      const submission = await createSubmission(
        server,
        CONTACT_IDENTIFIER_CREATE_SMALL_CATCH
      )
      const submissionId = JSON.parse(submission.payload).id

      const activity = await createActivity(server, submissionId)
      const activityId = JSON.parse(activity.payload).id

      const smallCatches = await createSmallCatch(server, activityId)

      const smallCatchesId = JSON.parse(smallCatches.payload).id
      expect(JSON.parse(smallCatches.payload)).toEqual({
        id: expect.any(String),
        month: 'FEBRUARY',
        count: [
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
      const submission = await createSubmission(
        server,
        CONTACT_IDENTIFIER_CREATE_SMALL_CATCH
      )
      const submissionId = JSON.parse(submission.payload).id

      const activity = await createActivity(server, submissionId)
      const activityId = JSON.parse(activity.payload).id

      const smallCatch1 = await createSmallCatch(server, activityId)

      expect(smallCatch1.statusCode).toBe(201)

      const smallCatch2 = await createSmallCatch(server, activityId)

      expect(smallCatch2.statusCode).toBe(400)
      expect(JSON.parse(smallCatch2.payload)).toEqual({
        errors: [
          {
            message: 'SMALL_CATCH_DUPLICATE_FOUND',
            property: 'month',
            value: 'FEBRUARY'
          }
        ]
      })
    })

    it('should throw an error if a small catch has the same method twice', async () => {
      const submission = await createSubmission(
        server,
        CONTACT_IDENTIFIER_CREATE_SMALL_CATCH
      )
      const submissionId = JSON.parse(submission.payload).id

      const activity = await createActivity(server, submissionId)
      const activityId = JSON.parse(activity.payload).id

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
            message: 'SMALL_CATCH_RELEASED_EXCEEDS_COUNTS',
            property: 'released',
            value: 6
          }
        ]
      })
      expect(smallCatch.statusCode).toBe(400)
    })

    it('should throw an error if small catch month is in the future', async () => {
      const futureMonth = currentMonth === 12 ? 1 : currentMonth + 1
      const futureSeason = currentMonth === 12 ? currentYear + 1 : currentYear

      const submission = await createSubmission(
        server,
        CONTACT_IDENTIFIER_CREATE_SMALL_CATCH,
        {
          season: futureSeason
        }
      )
      const submissionId = JSON.parse(submission.payload).id

      const activity = await createActivity(server, submissionId)
      const activityId = JSON.parse(activity.payload).id

      const smallCatch = await createSmallCatch(server, activityId, {
        month: getMonthNameFromNumber(futureMonth)
      })

      expect(JSON.parse(smallCatch.payload)).toEqual({
        errors: [
          {
            message: 'SMALL_CATCH_MONTH_IN_FUTURE',
            value: {
              activity: expect.any(String),
              counts: [
                {
                  count: 3,
                  method: 'methods/1'
                },
                {
                  count: 2,
                  method: 'methods/2'
                },
                {
                  count: 1,
                  method: 'methods/3'
                }
              ],
              month: expect.any(String),
              noMonthRecorded: false,
              released: 3
            }
          }
        ]
      })
      expect(smallCatch.statusCode).toBe(400)
    })
  })
})
