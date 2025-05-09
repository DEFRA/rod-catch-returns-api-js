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
            entity: 'Catch',
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
            entity: 'Catch',
            message: 'CATCH_METHOD_FORBIDDEN',
            property: 'method',
            value: 'methods/4'
          }
        ]
      })
      expect(createdCatch.statusCode).toBe(400)
    })

    it('should throw an error if the "species" does not exist', async () => {
      const activityId = await setupSubmissionAndActivity(
        CONTACT_IDENTIFIER_CREATE_CATCH
      )

      const createdCatch = await createCatch(server, activityId, {
        species: 'species/10' // this species does not exist
      })

      expect(JSON.parse(createdCatch.payload)).toEqual({
        errors: [
          {
            entity: 'Catch',
            message: 'CATCH_SPECIES_REQUIRED',
            property: 'species',
            value: 'species/10'
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
    const CONTACT_IDENTIFIER_GET_SPECIES_FOR_CATCH =
      'contact-identifier-get-species-for-catch'

    beforeEach(
      async () =>
        await deleteSubmissionAndRelatedData(
          CONTACT_IDENTIFIER_GET_SPECIES_FOR_CATCH
        )
    )

    afterAll(
      async () =>
        await deleteSubmissionAndRelatedData(
          CONTACT_IDENTIFIER_GET_SPECIES_FOR_CATCH
        )
    )

    it('should successfully get the species associated with a catch', async () => {
      const activityId = await setupSubmissionAndActivity(
        CONTACT_IDENTIFIER_GET_SPECIES_FOR_CATCH
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

  describe('GET /api/catches/{catchId}/method', () => {
    const CONTACT_IDENTIFIER_GET_METHOD_FOR_CATCH =
      'contact-identifier-get-method-for-catch'

    beforeEach(
      async () =>
        await deleteSubmissionAndRelatedData(
          CONTACT_IDENTIFIER_GET_METHOD_FOR_CATCH
        )
    )

    afterAll(
      async () =>
        await deleteSubmissionAndRelatedData(
          CONTACT_IDENTIFIER_GET_METHOD_FOR_CATCH
        )
    )

    it('should successfully get the method associated with a catch', async () => {
      const activityId = await setupSubmissionAndActivity(
        CONTACT_IDENTIFIER_GET_METHOD_FOR_CATCH
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
            href: expect.stringMatching('/api/methods/1')
          },
          method: {
            href: expect.stringMatching('/api/methods/1')
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

  describe('GET /api/catches/{catchId}', () => {
    const CONTACT_IDENTIFIER_GET_CATCH = 'contact-identifier-get-catch'

    beforeEach(
      async () =>
        await deleteSubmissionAndRelatedData(CONTACT_IDENTIFIER_GET_CATCH)
    )

    afterAll(
      async () =>
        await deleteSubmissionAndRelatedData(CONTACT_IDENTIFIER_GET_CATCH)
    )

    it('should successfully get a catch if it exists', async () => {
      const activityId = await setupSubmissionAndActivity(
        CONTACT_IDENTIFIER_GET_CATCH
      )

      const createdCatch = await createCatch(server, activityId)

      const catchId = JSON.parse(createdCatch.payload).id

      const species = await server.inject({
        method: 'GET',
        url: `/api/catches/${catchId}`
      })

      expect(JSON.parse(species.payload)).toEqual({
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
            href: expect.stringMatching(`/api/catches/${catchId}`)
          },
          catch: {
            href: expect.stringMatching(`/api/catches/${catchId}`)
          },
          activityEntity: {
            href: expect.stringMatching(`/api/activities/${activityId}`)
          },
          species: {
            href: expect.stringMatching(`/api/catches/${catchId}/species`)
          },
          method: {
            href: expect.stringMatching(`/api/catches/${catchId}/method`)
          },
          activity: {
            href: expect.stringMatching(`/api/catches/${catchId}/activity`)
          }
        }
      })
      expect(species.statusCode).toBe(200)
    })

    it('should return a 404 and empty body if the catch could not be found', async () => {
      const result = await server.inject({
        method: 'GET',
        url: '/api/catches/0'
      })

      expect(result.statusCode).toBe(404)
      expect(result.payload).toBe('')
    })
  })

  describe('DELETE /api/catches/{catchId}', () => {
    const CONTACT_IDENTIFIER_DELETE_CATCH = 'contact-identifier-delete-catch'

    beforeEach(
      async () =>
        await deleteSubmissionAndRelatedData(CONTACT_IDENTIFIER_DELETE_CATCH)
    )

    afterAll(
      async () =>
        await deleteSubmissionAndRelatedData(CONTACT_IDENTIFIER_DELETE_CATCH)
    )

    it('should return a 204 and delete a catch', async () => {
      const activityId = await setupSubmissionAndActivity(
        CONTACT_IDENTIFIER_DELETE_CATCH
      )

      const createdCatch = await createCatch(server, activityId)

      const catchId = JSON.parse(createdCatch.payload).id

      // make sure catch exists
      const foundCatch = await server.inject({
        method: 'GET',
        url: `/api/catches/${catchId}`
      })
      expect(foundCatch.statusCode).toBe(200)

      // delete catch
      const deletedCatch = await server.inject({
        method: 'DELETE',
        url: `/api/catches/${catchId}`
      })
      expect(deletedCatch.statusCode).toBe(204)
      expect(deletedCatch.body).toBeUndefined()

      // make sure catch has been deleted
      const foundCatchAfterDelete = await server.inject({
        method: 'GET',
        url: `/api/catches/${catchId}`
      })
      expect(foundCatchAfterDelete.statusCode).toBe(404)
    })

    it('should return a 404 and empty body if the catch could not be deleted', async () => {
      const result = await server.inject({
        method: 'DELETE',
        url: '/api/catches/0'
      })

      expect(result.statusCode).toBe(404)
      expect(result.payload).toBe('')
    })
  })

  describe('PATCH /api/catches/{catchId}', () => {
    const CONTACT_IDENTIFIER_UPDATE_CATCH = 'contact-identifier-update-catch'
    beforeEach(
      async () =>
        await deleteSubmissionAndRelatedData(CONTACT_IDENTIFIER_UPDATE_CATCH)
    )

    afterAll(
      async () =>
        await deleteSubmissionAndRelatedData(CONTACT_IDENTIFIER_UPDATE_CATCH)
    )

    test.each([
      {
        field: 'dateCaught',
        value: '2023-05-01T00:00:00+01:00',
        expected: '2023-05-01'
      },
      { field: 'released', value: false, expected: false },
      { field: 'onlyMonthRecorded', value: true, expected: true },
      { field: 'noDateRecorded', value: true, expected: true }
    ])(
      'should successfully update a catch with a valid $field',
      async ({ field, value, expected }) => {
        // Create submission, activity, and catch
        const activityId = await setupSubmissionAndActivity(
          CONTACT_IDENTIFIER_UPDATE_CATCH
        )
        const createdCatch = await createCatch(server, activityId)
        const catchId = JSON.parse(createdCatch.payload).id

        // Update catch field
        const updatedCatch = await server.inject({
          method: 'PATCH',
          url: `/api/catches/${catchId}`,
          payload: {
            [field]: value
          }
        })
        expect(updatedCatch.statusCode).toBe(200)

        // Verify field has been updated
        const foundUpdatedCatch = await server.inject({
          method: 'GET',
          url: `/api/catches/${catchId}`
        })
        const updatedPayload = JSON.parse(foundUpdatedCatch.payload)
        expect(updatedPayload[field]).toBe(expected)
      }
    )

    test.each([
      {
        value: { kg: 10, oz: 353, type: 'METRIC' },
        expected: { kg: 10, oz: 352.739619, type: 'METRIC' }
      },
      {
        value: { kg: 10, oz: 353, type: 'IMPERIAL' },
        expected: { kg: 10.007382, oz: 353, type: 'IMPERIAL' }
      }
    ])(
      'should successfully update a catch with a valid mass in $value.type format',
      async ({ value, expected }) => {
        // Create submission, activity, and catch
        const activityId = await setupSubmissionAndActivity(
          CONTACT_IDENTIFIER_UPDATE_CATCH
        )
        const createdCatch = await createCatch(server, activityId)
        const catchId = JSON.parse(createdCatch.payload).id

        // Update catch field with new mass
        const updatedCatch = await server.inject({
          method: 'PATCH',
          url: `/api/catches/${catchId}`,
          payload: {
            mass: value
          }
        })
        expect(updatedCatch.statusCode).toBe(200)

        // Verify field has been updated
        const foundUpdatedCatch = await server.inject({
          method: 'GET',
          url: `/api/catches/${catchId}`
        })
        const updatedPayload = JSON.parse(foundUpdatedCatch.payload)
        expect(updatedPayload.mass).toEqual(expected)
      }
    )

    it('should successfully update an catch with a valid species', async () => {
      // create submission, activity and catch
      const activityId = await setupSubmissionAndActivity(
        CONTACT_IDENTIFIER_UPDATE_CATCH
      )
      const createdCatch = await createCatch(server, activityId)
      const catchId = JSON.parse(createdCatch.payload).id

      // check initial value of species
      const createdSpecies = await server.inject({
        method: 'GET',
        url: `/api/catches/${catchId}/species`
      })
      expect(JSON.parse(createdSpecies.payload)._links.self.href).toEqual(
        expect.stringMatching(`/api/species/1`)
      )

      // Update catch with new species
      const updatedCatch = await server.inject({
        method: 'PATCH',
        url: `/api/catches/${catchId}`,
        payload: {
          species: 'species/2'
        }
      })
      expect(updatedCatch.statusCode).toBe(200)

      // check species has been updated
      const updatedSpecies = await server.inject({
        method: 'GET',
        url: `/api/catches/${catchId}/species`
      })
      expect(JSON.parse(updatedSpecies.payload)._links.self.href).toEqual(
        expect.stringMatching(`/api/species/2`)
      )
    })

    it('should successfully update an catch with a valid method', async () => {
      // create submission, activity and catch
      const activityId = await setupSubmissionAndActivity(
        CONTACT_IDENTIFIER_UPDATE_CATCH
      )
      const createdCatch = await createCatch(server, activityId)
      const catchId = JSON.parse(createdCatch.payload).id
      // check initial value of method
      const createdMethod = await server.inject({
        method: 'GET',
        url: `/api/catches/${catchId}/method`
      })
      expect(JSON.parse(createdMethod.payload)._links.self.href).toEqual(
        expect.stringMatching(`/api/methods/1`)
      )

      // Update catch with new method
      const updatedCatch = await server.inject({
        method: 'PATCH',
        url: `/api/catches/${catchId}`,
        payload: {
          method: 'methods/2'
        }
      })
      expect(updatedCatch.statusCode).toBe(200)

      // check species has been updated
      const updatedMethod = await server.inject({
        method: 'GET',
        url: `/api/catches/${catchId}/method`
      })
      expect(JSON.parse(updatedMethod.payload)._links.self.href).toEqual(
        expect.stringMatching(`/api/methods/2`)
      )
    })

    it('should throw an error if noDateRecorded is true and onlyMonthRecorded is false in the database, then onlyMonthRecorded is true', async () => {
      // create submission, activity and catch
      const activityId = await setupSubmissionAndActivity(
        CONTACT_IDENTIFIER_UPDATE_CATCH
      )
      const createdCatch = await createCatch(server, activityId, {
        noDateRecorded: true,
        onlyMonthRecorded: false
      })
      const catchId = JSON.parse(createdCatch.payload).id

      // Update catch
      const updatedCatch = await server.inject({
        method: 'PATCH',
        url: `/api/catches/${catchId}`,
        payload: {
          onlyMonthRecorded: true
        }
      })
      expect(JSON.parse(updatedCatch.payload)).toEqual({
        errors: [
          {
            entity: 'Catch',
            message: 'CATCH_NO_DATE_RECORDED_WITH_ONLY_MONTH_RECORDED',
            property: 'dateCaught'
          }
        ]
      })
      expect(updatedCatch.statusCode).toBe(400)
    })

    it('should throw an error if noDateRecorded is false and onlyMonthRecorded is true in the database, then noDateRecorded is true', async () => {
      // create submission, activity and catch
      const activityId = await setupSubmissionAndActivity(
        CONTACT_IDENTIFIER_UPDATE_CATCH
      )
      const createdCatch = await createCatch(server, activityId, {
        noDateRecorded: false,
        onlyMonthRecorded: true
      })
      const catchId = JSON.parse(createdCatch.payload).id

      // Update catch
      const updatedCatch = await server.inject({
        method: 'PATCH',
        url: `/api/catches/${catchId}`,
        payload: {
          noDateRecorded: true
        }
      })
      expect(JSON.parse(updatedCatch.payload)).toEqual({
        errors: [
          {
            entity: 'Catch',
            message: 'CATCH_NO_DATE_RECORDED_WITH_ONLY_MONTH_RECORDED',
            property: 'dateCaught'
          }
        ]
      })
      expect(updatedCatch.statusCode).toBe(400)
    })

    it('should throw an error if mass is an empty object', async () => {
      // create submission, activity and catch
      const activityId = await setupSubmissionAndActivity(
        CONTACT_IDENTIFIER_UPDATE_CATCH
      )
      const createdCatch = await createCatch(server, activityId)
      const catchId = JSON.parse(createdCatch.payload).id

      // Update catch
      const updatedCatch = await server.inject({
        method: 'PATCH',
        url: `/api/catches/${catchId}`,
        payload: {
          mass: {}
        }
      })
      expect(JSON.parse(updatedCatch.payload)).toEqual({
        errors: [
          {
            entity: 'Catch',
            message: 'CATCH_MASS_TYPE_REQUIRED',
            property: 'mass',
            value: {}
          }
        ]
      })
      expect(updatedCatch.statusCode).toBe(400)
    })

    it('should throw an error if species does not exist', async () => {
      // create submission, activity and catch
      const activityId = await setupSubmissionAndActivity(
        CONTACT_IDENTIFIER_UPDATE_CATCH
      )
      const createdCatch = await createCatch(server, activityId)
      const catchId = JSON.parse(createdCatch.payload).id

      // check initial value of species
      const createdSpecies = await server.inject({
        method: 'GET',
        url: `/api/catches/${catchId}/species`
      })
      expect(JSON.parse(createdSpecies.payload)._links.self.href).toEqual(
        expect.stringMatching(`/api/species/1`)
      )

      // Update catch with new species
      const updatedCatch = await server.inject({
        method: 'PATCH',
        url: `/api/catches/${catchId}`,
        payload: {
          species: 'species/10'
        }
      })
      expect(JSON.parse(updatedCatch.payload)).toEqual({
        errors: [
          {
            entity: 'Catch',
            message: 'CATCH_SPECIES_REQUIRED',
            property: 'species',
            value: 'species/10'
          }
        ]
      })
      expect(updatedCatch.statusCode).toBe(400)
    })
  })
})
