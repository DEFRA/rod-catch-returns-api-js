import {
  createActivity,
  createCatch,
  createSubmission
} from '../../../test-utils/server-test-utils.js'
import { deleteSubmissionAndRelatedData } from '../../../test-utils/database-test-utils.js'
import initialiseServer from '../../server.js'

describe.skip('catches.integration', () => {
  /** @type {import('@hapi/hapi').Server} */
  let server = null

  beforeAll(async () => {
    server = await initialiseServer({ port: null })
  })

  afterAll(async () => {
    await server.stop()
  })

  describe('POST /api/catches ', () => {
    const CONTACT_IDENTIFIER_CREATE_CATCH = 'contact-identifier-create-catch'

    beforeEach(
      async () =>
        await deleteSubmissionAndRelatedData(CONTACT_IDENTIFIER_CREATE_CATCH)
    )

    afterAll(
      async () =>
        await deleteSubmissionAndRelatedData(CONTACT_IDENTIFIER_CREATE_CATCH)
    )

    const setupSubmissionAndActivity = async () => {
      const submission = await createSubmission(
        server,
        CONTACT_IDENTIFIER_CREATE_CATCH
      )
      const submissionId = JSON.parse(submission.payload).id
      const activity = await createActivity(server, submissionId)
      return JSON.parse(activity.payload).id
    }

    it('should successfully create a catch for a submission with a valid request', async () => {
      const activityId = await setupSubmissionAndActivity()

      const createdCatch = await createCatch(server, activityId)

      const createdCatchId = JSON.parse(createdCatch.payload).id

      expect(createdCatch.statusCode).toBe(201)
      expect(JSON.parse(createdCatch.payload)).toEqual({
        id: expect.any(String),
        daysFishedWithMandatoryRelease: 20,
        daysFishedOther: 10,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        version: expect.any(String),
        _links: {
          self: {
            href: expect.stringMatching(`/api/activities/${createdCatchId}`)
          },
          activity: {
            href: expect.stringMatching(`/api/activities/${createdCatchId}`)
          },
          submission: {
            href: expect.stringMatching(
              `/api/activities/${createdCatchId}/submission`
            )
          },
          catches: {
            href: expect.stringMatching(
              `/api/activities/${createdCatchId}/catches`
            )
          },
          river: {
            href: expect.stringMatching(
              `/api/activities/${createdCatchId}/river`
            )
          },
          smallCatches: {
            href: expect.stringMatching(
              `/api/activities/${createdCatchId}/smallCatches`
            )
          }
        }
      })
    })
  })
})
