import {
  createActivity,
  createSubmission
} from '../../../test-utils/server-test-utils.js'
import { Submission } from '../../../entities/index.js'
import { createActivity as createActivityCRM } from '@defra-fish/dynamics-lib'
import { deleteSubmissionAndRelatedData } from '../../../test-utils/database-test-utils.js'
import initialiseServer from '../../server.js'

const createExpectedActivity = (
  id,
  daysFishedWithMandatoryRelease,
  daysFishedOther
) => ({
  id,
  daysFishedWithMandatoryRelease,
  daysFishedOther,
  createdAt: expect.any(String),
  updatedAt: expect.any(String),
  version: expect.any(String),
  _links: {
    activity: {
      href: expect.stringMatching(`api/activities/${id}`)
    },
    catches: {
      href: expect.stringMatching(`api/activities/${id}/catches`)
    },
    river: {
      href: expect.stringMatching(`api/activities/${id}/river`)
    },
    self: {
      href: expect.stringMatching(`api/activities/${id}`)
    },
    smallCatches: {
      href: expect.stringMatching(`api/activities/${id}/smallCatches`)
    },
    submission: {
      href: expect.stringMatching(`api/activities/${id}/submission`)
    }
  }
})

describe('submissions.integration', () => {
  /** @type {import('@hapi/hapi').Server} */
  let server = null

  beforeAll(async () => {
    server = await initialiseServer({ port: null })
  })

  afterAll(async () => {
    await server.stop()
  })

  const getCreateActivityResponse = () => ({
    '@odata.context':
      'https://dynamics.com/api/data/v9.1/defra_CreateRCRActivityResponse',
    RCRActivityId: 'abc123',
    ReturnStatus: 'success',
    SuccessMessage: 'RCR Activity - created successfully',
    ErrorMessage: null,
    oDataContext:
      'https://dynamics.com/api/data/v9.1/defra_CreateRCRActivityResponse'
  })

  describe('POST /api/submissions', () => {
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
      createActivityCRM.mockResolvedValue(getCreateActivityResponse())
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

    it('should successfully create a Submission when the call to create an activity in CRM returns an ErrorMessage', async () => {
      createActivityCRM.mockResolvedValue({
        '@odata.context':
          'https://dynamics.com/api/data/v9.1/defra_CreateRCRActivityResponse',
        RCRActivityId: null,
        ReturnStatus: 'error',
        SuccessMessage: '',
        ErrorMessage: 'Failed to create activity'
      })
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
    })

    it('should return a 500 when the call to create an activity in CRM throws an error', async () => {
      createActivityCRM.mockRejectedValueOnce(new Error('CRM error'))
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

      expect(result.statusCode).toBe(500)
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
    const CONTACT_IDENTIFIER_GET_ACTIVITIES_FOR_SUBMISSION =
      'contact-identifier-get-activities-for-submission'

    beforeEach(() =>
      deleteSubmissionAndRelatedData(
        CONTACT_IDENTIFIER_GET_ACTIVITIES_FOR_SUBMISSION
      )
    )

    afterAll(() =>
      deleteSubmissionAndRelatedData(
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
      const createdActivity1 = await createActivity(server, submissionId)
      const createdActivity1Id = JSON.parse(createdActivity1.payload).id

      const createdActivity2 = await createActivity(server, submissionId, {
        river: 'rivers/5',
        daysFishedWithMandatoryRelease: 5,
        daysFishedOther: 3
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
      const activities = JSON.parse(result.payload)._embedded.activities
      expect(activities).toEqual(
        expect.arrayContaining([
          createExpectedActivity(createdActivity1Id, 20, 10),
          createExpectedActivity(createdActivity2Id, 5, 3)
        ])
      )
    })

    it('should return a 404 and an empty body if the submission does not exist', async () => {
      const result = await server.inject({
        method: 'GET',
        url: '/api/submissions/0/activities'
      })

      expect(result.statusCode).toBe(404)
      expect(result.payload).toBe('')
    })

    it('should return a 200 and with an empty activity array if the submission exists, but has not activities', async () => {
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

      const result = await server.inject({
        method: 'GET',
        url: `/api/submissions/${submissionId}/activities`
      })

      expect(result.statusCode).toBe(200)
      expect(JSON.parse(result.payload)).toStrictEqual({
        _embedded: {
          activities: []
        }
      })
    })
  })

  describe.skip('PATCH /api/submissions/{submissionId}', () => {
    const CONTACT_IDENTIFIER_UPDATE_SUBMISSION =
      'contact-identifier-update-submission'
    beforeEach(async () => {
      await Submission.destroy({
        where: {
          contactId: CONTACT_IDENTIFIER_UPDATE_SUBMISSION
        }
      })
    })

    afterAll(async () => {
      await Submission.destroy({
        where: {
          contactId: CONTACT_IDENTIFIER_UPDATE_SUBMISSION
        }
      })
    })

    it('should successfully update a submission with a valid status', async () => {
      createActivityCRM.mockResolvedValue(getCreateActivityResponse())
      const createdSubmission = createSubmission(server)
      const submissionId = JSON.parse(createdSubmission.payload).id
      expect(JSON.parse(createdSubmission.payload).status).toBe('INCOMPLETE')

      const updatedSubmission = await server.inject({
        method: 'POST',
        url: `/api/submissions/${submissionId}`,
        payload: {
          status: 'COMPLETE'
        }
      })

      expect(updatedSubmission.statusCode).toBe(200)
      expect(JSON.parse(updatedSubmission.payload).status).toBe('COMPLETE')
    })

    it('should successfully update a submission when reportingExclude is true', async () => {
      createActivityCRM.mockResolvedValue(getCreateActivityResponse())
      const createdSubmission = createSubmission(server)
      const submissionId = JSON.parse(createdSubmission.payload).id
      expect(JSON.parse(createdSubmission.payload).reportingExclude).toBeFalsy()

      const updatedSubmission = await server.inject({
        method: 'POST',
        url: `/api/submissions/${submissionId}`,
        payload: {
          reportingExclude: true
        }
      })

      expect(updatedSubmission.statusCode).toBe(200)
      expect(
        JSON.parse(updatedSubmission.payload).reportingExclude
      ).toBeTruthy()
    })
  })
})
