import {
  createActivity,
  createCatch,
  createSubmission
} from '../../../test-utils/server-test-utils.js'
import { createActivity as createActivityCRM } from '@defra-fish/dynamics-lib'
import { deleteSubmissionAndRelatedData } from '../../../test-utils/database-test-utils.js'
import { getCreateActivityResponse } from '../../../test-utils/test-data.js'
import initialiseServer from '../../server.js'

describe('catches.integration', () => {
  /** @type {import('@hapi/hapi').Server} */
  let server = null

  beforeAll(async () => {
    createActivityCRM.mockResolvedValue(getCreateActivityResponse())
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

      expect(JSON.parse(createdCatch.payload)).toEqual({
        id: expect.any(String),
        dateCaught: '2023-06-24',
        mass: {
          type: 'IMPERIAL',
          kg: '9.610488',
          oz: '339.000000'
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
            href: expect.stringMatching(`/api/catches/${createdCatchId}/method`)
          },
          activity: {
            href: expect.stringMatching(
              `/api/catches/${createdCatchId}/activity`
            )
          }
        }
      })
      expect(createdCatch.statusCode).toBe(201)
    })

    it('should throw an error if the "dateCaught" year does not match the "season" in the submission', async () => {
      const activityId = await setupSubmissionAndActivity()

      const createdCatch = await createCatch(server, activityId, {
        dateCaught: '2022-06-24T00:00:00+01:00'
      })

      expect(JSON.parse(createdCatch.payload)).toEqual({
        errors: [
          {
            message: 'CATCH_YEAR_MISMATCH',
            property: 'dateCaught',
            value: '2022-06-24T00:00:00+01:00'
          }
        ]
      })
      expect(createdCatch.statusCode).toBe(400)
    })

    it('should throw an error if the "method" is internal', async () => {
      const activityId = await setupSubmissionAndActivity()

      const createdCatch = await createCatch(server, activityId, {
        method: 'methods/4' // this method name is Unknown and is internal
      })

      expect(JSON.parse(createdCatch.payload)).toEqual({
        errors: [
          {
            message: 'CATCH_METHOD_FORBIDDEN',
            property: 'method',
            value: 'methods/4'
          }
        ]
      })
      expect(createdCatch.statusCode).toBe(400)
    })
  })
})
