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

  const setupSubmissionAndActivity = async (contactId) => {
    const submission = await createSubmission(server, contactId)
    const submissionId = JSON.parse(submission.payload).id
    const activity = await createActivity(server, submissionId)
    return JSON.parse(activity.payload).id
  }

  describe('POST /api/catches', () => {
    const CONTACT_IDENTIFIER_CREATE_CATCH = 'contact-identifier-create-catch'

    beforeEach(
      async () =>
        await deleteSubmissionAndRelatedData(CONTACT_IDENTIFIER_CREATE_CATCH)
    )

    afterAll(
      async () =>
        await deleteSubmissionAndRelatedData(CONTACT_IDENTIFIER_CREATE_CATCH)
    )

    it('should successfully create a catch for a submission with a valid request', async () => {
      const activityId = await setupSubmissionAndActivity(
        CONTACT_IDENTIFIER_CREATE_CATCH
      )

      const createdCatch = await createCatch(server, activityId)

      const createdCatchId = JSON.parse(createdCatch.payload).id

      expect(JSON.parse(createdCatch.payload)).toEqual({
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
      const activityId = await setupSubmissionAndActivity(
        CONTACT_IDENTIFIER_CREATE_CATCH
      )

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
      const activityId = await setupSubmissionAndActivity(
        CONTACT_IDENTIFIER_CREATE_CATCH
      )

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

  describe('GET /api/catches/{catchId}/activity', () => {
    const CONTACT_IDENTIFIER_GET_ACTIVITY_FOR_CATCH =
      'contact-identifier-get-activity-for-catch'

    beforeEach(
      async () =>
        await deleteSubmissionAndRelatedData(
          CONTACT_IDENTIFIER_GET_ACTIVITY_FOR_CATCH
        )
    )

    afterAll(
      async () =>
        await deleteSubmissionAndRelatedData(
          CONTACT_IDENTIFIER_GET_ACTIVITY_FOR_CATCH
        )
    )

    it('should successfully get the activity associated with a catch', async () => {
      const activityId = await setupSubmissionAndActivity(
        CONTACT_IDENTIFIER_GET_ACTIVITY_FOR_CATCH
      )

      const createdCatch = await createCatch(server, activityId)

      const catchId = JSON.parse(createdCatch.payload).id

      const activity = await server.inject({
        method: 'GET',
        url: `/api/catches/${catchId}/activity`
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
        url: '/api/catches/0/activity'
      })

      expect(result.statusCode).toBe(404)
      expect(result.payload).toBe('')
    })
  })

  describe('GET /api/catches/{catchId}/species', () => {
    const CONTACT_IDENTIFIER_GET_ACTIVITY_FOR_SPECIES =
      'contact-identifier-get-activity-for-species'

    beforeEach(
      async () =>
        await deleteSubmissionAndRelatedData(
          CONTACT_IDENTIFIER_GET_ACTIVITY_FOR_SPECIES
        )
    )

    afterAll(
      async () =>
        await deleteSubmissionAndRelatedData(
          CONTACT_IDENTIFIER_GET_ACTIVITY_FOR_SPECIES
        )
    )

    it('should successfully get the species associated with a catch', async () => {
      const activityId = await setupSubmissionAndActivity(
        CONTACT_IDENTIFIER_GET_ACTIVITY_FOR_SPECIES
      )

      const createdCatch = await createCatch(server, activityId)

      const catchId = JSON.parse(createdCatch.payload).id

      const species = await server.inject({
        method: 'GET',
        url: `/api/catches/${catchId}/species`
      })

      expect(JSON.parse(species.payload)).toEqual({
        id: '1',
        name: 'Salmon',
        smallCatchMass: 0.396893,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        _links: {
          self: {
            href: expect.stringMatching('/api/species/1')
          },
          species: {
            href: expect.stringMatching('/api/species/1')
          }
        }
      })
      expect(species.statusCode).toBe(200)
    })

    it('should return a 404 and empty body if the species could not be found', async () => {
      const result = await server.inject({
        method: 'GET',
        url: '/api/catches/0/species'
      })

      expect(result.statusCode).toBe(404)
      expect(result.payload).toBe('')
    })
  })

  describe.skip('GET /api/catches/{catchId}/method', () => {
    const CONTACT_IDENTIFIER_GET_ACTIVITY_FOR_METHOD =
      'contact-identifier-get-activity-for-method'

    beforeEach(
      async () =>
        await deleteSubmissionAndRelatedData(
          CONTACT_IDENTIFIER_GET_ACTIVITY_FOR_METHOD
        )
    )

    afterAll(
      async () =>
        await deleteSubmissionAndRelatedData(
          CONTACT_IDENTIFIER_GET_ACTIVITY_FOR_METHOD
        )
    )

    it('should successfully get the method associated with a catch', async () => {
      const activityId = await setupSubmissionAndActivity(
        CONTACT_IDENTIFIER_GET_ACTIVITY_FOR_METHOD
      )

      const createdCatch = await createCatch(server, activityId)

      const catchId = JSON.parse(createdCatch.payload).id

      const fishingMethod = await server.inject({
        method: 'GET',
        url: `/api/catches/${catchId}/method`
      })

      expect(JSON.parse(fishingMethod.payload)).toEqual({
        id: '1',
        internal: false,
        name: 'Fly',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        _links: {
          self: {
            href: expect.stringMatching('/api/method/1')
          },
          method: {
            href: expect.stringMatching('/api/method/1')
          }
        }
      })
      expect(fishingMethod.statusCode).toBe(200)
    })

    it('should return a 404 and empty body if the method could not be found', async () => {
      const result = await server.inject({
        method: 'GET',
        url: '/api/catches/0/method'
      })

      expect(result.statusCode).toBe(404)
      expect(result.payload).toBe('')
    })
  })
})
