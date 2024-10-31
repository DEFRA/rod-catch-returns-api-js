import {
  createActivity,
  createSubmission
} from '../../../test-utils/server-test-utils.js'
import { deleteSmallCatchesActivitiesAndSubmissions } from '../../../test-utils/database-test-utils.js'
import initialiseServer from '../../server.js'

describe('small-catches.integration', () => {
  /** @type {import('@hapi/hapi').Server} */
  let server = null

  beforeAll(async () => {
    server = await initialiseServer({ port: null })
  })

  afterAll(async () => {
    await server.stop()
  })

  describe('POST /api/smallCatches ', () => {
    const CONTACT_IDENTIFIER_CREATE_SMALL_CATCH =
      'contact-identifier-create-small-catch'
    beforeEach(() =>
      deleteSmallCatchesActivitiesAndSubmissions(
        CONTACT_IDENTIFIER_CREATE_SMALL_CATCH
      )
    )

    afterAll(() =>
      deleteSmallCatchesActivitiesAndSubmissions(
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

      const smallCatches = await server.inject({
        method: 'POST',
        url: '/api/smallCatches',
        payload: {
          activity: `activities/${activityId}`,
          month: 'FEBRUARY',
          released: '3',
          counts: [
            {
              method: 'methods/1',
              count: '3'
            },
            {
              method: 'methods/2',
              count: '2'
            },
            {
              method: 'methods/3',
              count: '1'
            }
          ],
          noMonthRecorded: false
        }
      })

      expect(smallCatches.statusCode).toBe(201)
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
    })
  })
})
