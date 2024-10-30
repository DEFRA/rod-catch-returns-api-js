import {
  createActivity,
  createSubmission
} from '../../../test-utils/server-test-utils.js'
import { deleteSmallCatchesActivitiesAndSubmissions } from '../../../test-utils/database-test-utils.js'
import initialiseServer from '../../server.js'

describe.skip('small-catches.integration', () => {
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
      expect(JSON.parse(smallCatches.payload)).toEqual({})
    })
  })
})
