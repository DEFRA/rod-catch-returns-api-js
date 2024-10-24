import { Submission } from '../../../entities/index.js'
import { deleteActivitiesAndSubmissions } from '../../../test-utils/database-test-utils.js'
import initialiseServer from '../../server.js'

describe('submissions.integration', () => {
  /** @type {import('@hapi/hapi').Server} */
  let server = null

  beforeAll(async () => {
    server = await initialiseServer({ port: null })
  })

  afterAll(async () => {
    await server.stop()
  })

  describe('POST /api/submissions ', () => {
    const CONTACT_IDENTIFIER_CREATE_SUBMISSION =
      'contact-identifier-create-submission'
    beforeEach(async () => {
      await Submission.destroy({
        where: {
          contactId: CONTACT_IDENTIFIER_CREATE_SUBMISSION
        }
      })
    })

    afterAll(async () => {
      await Submission.destroy({
        where: {
          contactId: CONTACT_IDENTIFIER_CREATE_SUBMISSION
        }
      })
    })

    it('should successfully create a submission with a valid request', async () => {
      const result = await server.inject({
        method: 'POST',
        url: '/api/submissions',
        payload: {
          contactId: CONTACT_IDENTIFIER_CREATE_SUBMISSION,
          season: '2023',
          status: 'INCOMPLETE',
          source: 'WEB'
        }
      })

      expect(result.statusCode).toBe(201)
      expect(JSON.parse(result.payload)).toEqual({
        id: expect.any(String),
        contactId: 'contact-identifier-create-submission',
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
    })

    it('should return a 400 and error message if season is missing', async () => {
      const result = await server.inject({
        method: 'POST',
        url: '/api/submissions',
        payload: {
          contactId: CONTACT_IDENTIFIER_CREATE_SUBMISSION,
          status: 'INCOMPLETE',
          source: 'WEB'
        }
      })

      expect(result.statusCode).toBe(400)
      expect(JSON.parse(result.payload)).toEqual({
        errors: [
          {
            message: '"season" is required',
            property: 'season',
            value: undefined
          }
        ]
      })
    })

    it('should return a 400 and error message season is invalid', async () => {
      const result = await server.inject({
        method: 'POST',
        url: '/api/submissions',
        payload: {
          contactId: CONTACT_IDENTIFIER_CREATE_SUBMISSION,
          season: '20ab23',
          status: 'INCOMPLETE',
          source: 'WEB'
        }
      })

      expect(result.statusCode).toBe(400)
      expect(JSON.parse(result.payload)).toEqual({
        errors: [
          {
            message: '"season" must be a number',
            property: 'season',
            value: '20ab23'
          }
        ]
      })
    })

    it('should return a 400 and error message if status is missing', async () => {
      const result = await server.inject({
        method: 'POST',
        url: '/api/submissions',
        payload: {
          contactId: CONTACT_IDENTIFIER_CREATE_SUBMISSION,
          season: '2023',
          source: 'WEB'
        }
      })

      expect(result.statusCode).toBe(400)
      expect(JSON.parse(result.payload)).toEqual({
        errors: [
          {
            message: '"status" is required',
            property: 'status',
            value: undefined
          }
        ]
      })
    })

    it('should return a 400 and error message status is invalid', async () => {
      const result = await server.inject({
        method: 'POST',
        url: '/api/submissions',
        payload: {
          contactId: CONTACT_IDENTIFIER_CREATE_SUBMISSION,
          season: '2023',
          status: 'INVALID',
          source: 'WEB'
        }
      })

      expect(result.statusCode).toBe(400)
      expect(JSON.parse(result.payload)).toEqual({
        errors: [
          {
            message: '"status" must be one of [INCOMPLETE, SUBMITTED]',
            property: 'status',
            value: 'INVALID'
          }
        ]
      })
    })

    it('should return a 400 and error message if source is missing', async () => {
      const result = await server.inject({
        method: 'POST',
        url: '/api/submissions',
        payload: {
          contactId: CONTACT_IDENTIFIER_CREATE_SUBMISSION,
          season: '2023',
          status: 'INCOMPLETE'
        }
      })

      expect(result.statusCode).toBe(400)
      expect(JSON.parse(result.payload)).toEqual({
        errors: [
          {
            message: '"source" is required',
            property: 'source',
            value: undefined
          }
        ]
      })
    })

    it('should return a 400 and error message source is invalid', async () => {
      const result = await server.inject({
        method: 'POST',
        url: '/api/submissions',
        payload: {
          contactId: CONTACT_IDENTIFIER_CREATE_SUBMISSION,
          season: '2023',
          status: 'INCOMPLETE',
          source: 'INVALID'
        }
      })

      expect(result.statusCode).toBe(400)
      expect(JSON.parse(result.payload)).toEqual({
        errors: [
          {
            message: '"source" must be one of [WEB, PAPER]',
            property: 'source',
            value: 'INVALID'
          }
        ]
      })
    })
  })

  describe('GET /api/submissions/search/getByContactIdAndSeason?contact_id={contactId}&season={season}', () => {
    const CONTACT_IDENTIFIER_GET_SUBMISSION_BY_CONTACT =
      'contact-identifier-get-submission-by-contact'

    beforeEach(async () => {
      await Submission.destroy({
        where: {
          contactId: CONTACT_IDENTIFIER_GET_SUBMISSION_BY_CONTACT
        }
      })
    })

    afterAll(async () => {
      await Submission.destroy({
        where: {
          contactId: CONTACT_IDENTIFIER_GET_SUBMISSION_BY_CONTACT
        }
      })
    })

    it('should successfully get as submission with a valid contactId and season', async () => {
      await server.inject({
        method: 'POST',
        url: '/api/submissions',
        payload: {
          contactId: CONTACT_IDENTIFIER_GET_SUBMISSION_BY_CONTACT,
          season: '2023',
          status: 'INCOMPLETE',
          source: 'WEB'
        }
      })

      const result = await server.inject({
        method: 'GET',
        url: `/api/submissions/search/getByContactIdAndSeason?contact_id=${CONTACT_IDENTIFIER_GET_SUBMISSION_BY_CONTACT}&season=2023`
      })

      expect(result.statusCode).toBe(200)
      expect(JSON.parse(result.payload)).toEqual({
        id: expect.any(String),
        contactId: CONTACT_IDENTIFIER_GET_SUBMISSION_BY_CONTACT,
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
    })

    it('should return a 404 and an empty body if the contactId does not exist', async () => {
      const result = await server.inject({
        method: 'GET',
        url: `/api/submissions/search/getByContactIdAndSeason?contact_id=contact-identifier-unknown&season=2023`
      })

      expect(result.statusCode).toBe(404)
      expect(result.payload).toBe('')
    })

    it('should return a 404 and an empty body if the contact exists, but the season does not exist', async () => {
      await server.inject({
        method: 'POST',
        url: '/api/submissions',
        payload: {
          contactId: CONTACT_IDENTIFIER_GET_SUBMISSION_BY_CONTACT,
          season: '2023',
          status: 'INCOMPLETE',
          source: 'WEB'
        }
      })

      const result = await server.inject({
        method: 'GET',
        url: `/api/submissions/search/getByContactIdAndSeason?contact_id=${CONTACT_IDENTIFIER_GET_SUBMISSION_BY_CONTACT}&season=2022`
      })

      expect(result.statusCode).toBe(404)
      expect(result.payload).toBe('')
    })
  })

  describe('GET /api/submissions/{submissionId}', () => {
    const CONTACT_IDENTIFIER_GET_SUBMISSION_BY_ID =
      'contact-identifier-get-submission-by-id'

    beforeEach(async () => {
      await Submission.destroy({
        where: {
          contactId: CONTACT_IDENTIFIER_GET_SUBMISSION_BY_ID
        }
      })
    })

    afterAll(async () => {
      await Submission.destroy({
        where: {
          contactId: CONTACT_IDENTIFIER_GET_SUBMISSION_BY_ID
        }
      })
    })

    it('should successfully get a submission with a valid id', async () => {
      const createdSubmission = await server.inject({
        method: 'POST',
        url: '/api/submissions',
        payload: {
          contactId: CONTACT_IDENTIFIER_GET_SUBMISSION_BY_ID,
          season: '2023',
          status: 'INCOMPLETE',
          source: 'WEB'
        }
      })

      const submissionId = JSON.parse(createdSubmission.payload).id

      const result = await server.inject({
        method: 'GET',
        url: `/api/submissions/${submissionId}`
      })

      expect(result.statusCode).toBe(200)
      expect(JSON.parse(result.payload)).toEqual({
        id: expect.any(String),
        contactId: CONTACT_IDENTIFIER_GET_SUBMISSION_BY_ID,
        season: 2023,
        status: 'INCOMPLETE',
        source: 'WEB',
        reportingExclude: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        version: expect.any(String),
        _links: {
          activities: {
            href: expect.stringMatching(
              `api/submissions/${submissionId}/activities`
            )
          },
          self: {
            href: expect.stringMatching(`api/submissions/${submissionId}`)
          },
          submission: {
            href: expect.stringMatching(`api/submissions/${submissionId}`)
          }
        }
      })
    })

    it('should return a 404 and an empty body if the submission does not exist', async () => {
      const result = await server.inject({
        method: 'GET',
        url: '/api/submissions/0'
      })

      expect(result.statusCode).toBe(404)
      expect(result.payload).toBe('')
    })
  })

  describe('GET /api/submissions/{submissionId}/activites', () => {
    // TODO add tests if submission does not exist and if submission exists, but activities are empty
    const CONTACT_IDENTIFIER_GET_ACTIVITIES_FOR_SUBMISSION =
      'contact-identifier-get-activities-for-submission'

    beforeEach(() =>
      deleteActivitiesAndSubmissions(
        CONTACT_IDENTIFIER_GET_ACTIVITIES_FOR_SUBMISSION
      )
    )

    afterAll(() =>
      deleteActivitiesAndSubmissions(
        CONTACT_IDENTIFIER_GET_ACTIVITIES_FOR_SUBMISSION
      )
    )
    it('should successfully get all activivities for a submission with a valid submission id', async () => {
      // create a submission
      const createdSubmission = await server.inject({
        method: 'POST',
        url: '/api/submissions',
        payload: {
          contactId: CONTACT_IDENTIFIER_GET_ACTIVITIES_FOR_SUBMISSION,
          season: '2023',
          status: 'INCOMPLETE',
          source: 'WEB'
        }
      })

      const submissionId = JSON.parse(createdSubmission.payload).id

      // add 2 activities with different rivers
      const createdActivity1 = await server.inject({
        method: 'POST',
        url: '/api/activities',
        payload: {
          submission: `submissions/${submissionId}`,
          daysFishedWithMandatoryRelease: '20',
          daysFishedOther: '10',
          river: 'rivers/3'
        }
      })
      const createdActivity1Id = JSON.parse(createdActivity1.payload).id

      const createdActivity2 = await server.inject({
        method: 'POST',
        url: '/api/activities',
        payload: {
          submission: `submissions/${submissionId}`,
          daysFishedWithMandatoryRelease: '5',
          daysFishedOther: '3',
          river: 'rivers/1'
        }
      })
      const createdActivity2Id = JSON.parse(createdActivity2.payload).id

      const result = await server.inject({
        method: 'GET',
        url: `/api/submissions/${submissionId}/activities`,
        payload: {
          submission: `submissions/${submissionId}`,
          daysFishedWithMandatoryRelease: '5',
          daysFishedOther: '3',
          river: 'rivers/1'
        }
      })

      expect(result.statusCode).toBe(200)
      expect(JSON.parse(result.payload)).toEqual({
        _embedded: {
          activities: expect.arrayContaining([
            {
              _links: {
                activity: {
                  href: expect.stringMatching(
                    `api/activities/${createdActivity1Id}`
                  )
                },
                catches: {
                  href: expect.stringMatching(
                    `api/activities/${createdActivity1Id}/catches`
                  )
                },
                river: {
                  href: expect.stringMatching(
                    `api/activities/${createdActivity1Id}/river`
                  )
                },
                self: {
                  href: expect.stringMatching(
                    `api/activities/${createdActivity1Id}`
                  )
                },
                smallCatches: {
                  href: expect.stringMatching(
                    `api/activities/${createdActivity1Id}/smallCatches`
                  )
                },
                submission: {
                  href: expect.stringMatching(
                    `api/activities/${createdActivity1Id}/submission`
                  )
                }
              },
              createdAt: expect.any(String),
              daysFishedOther: 10,
              daysFishedWithMandatoryRelease: 20,
              id: createdActivity1Id,
              updatedAt: expect.any(String),
              version: expect.any(String)
            },
            {
              _links: {
                activity: {
                  href: expect.stringMatching(
                    `api/activities/${createdActivity2Id}`
                  )
                },
                catches: {
                  href: expect.stringMatching(
                    `api/activities/${createdActivity2Id}/catches`
                  )
                },
                river: {
                  href: expect.stringMatching(
                    `api/activities/${createdActivity2Id}/river`
                  )
                },
                self: {
                  href: expect.stringMatching(
                    `api/activities/${createdActivity2Id}`
                  )
                },
                smallCatches: {
                  href: expect.stringMatching(
                    `api/activities/${createdActivity2Id}/smallCatches`
                  )
                },
                submission: {
                  href: expect.stringMatching(
                    `api/activities/${createdActivity2Id}/submission`
                  )
                }
              },
              createdAt: expect.any(String),
              daysFishedOther: 3,
              daysFishedWithMandatoryRelease: 5,
              id: createdActivity2Id,
              updatedAt: expect.any(String),
              version: expect.any(String)
            }
          ])
        }
      })
    })
  })
})
