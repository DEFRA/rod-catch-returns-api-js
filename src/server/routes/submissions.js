import { Activity, Submission } from '../../entities/index.js'
import { createActivity, updateActivity } from '@defra-fish/dynamics-lib'
import {
  createSubmissionSchema,
  getBySubmissionIdSchema,
  getSubmissionByContactAndSeasonSchema,
  updateSubmissionSchema
} from '../../schemas/submission.schema.js'
import { handleNotFound, handleServerError } from '../../utils/server-utils.js'
import { STATUSES } from '../../utils/constants.js'
import { StatusCodes } from 'http-status-codes'
import logger from '../../utils/logger-utils.js'
import { mapActivityToResponse } from '../../mappers/activity.mapper.js'
import { mapSubmissionToResponse } from '../../mappers/submission.mapper.js'

export default [
  {
    method: 'POST',
    path: '/submissions',
    options: {
      /**
       * Create a new submission in the database
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link Submission}
       */
      handler: async (request, h) => {
        const { contactId, season, status, source, reportingExclude } =
          request.payload
        try {
          const createdSubmission = await Submission.create({
            contactId,
            season,
            status,
            source,
            reportingExclude,
            version: Date.now()
          })

          logger.info('Creating CRM activity with request:', contactId, season)

          const createCrmActivityResponse = await createActivity(
            contactId,
            season
          )

          if (createCrmActivityResponse.ErrorMessage) {
            logger.error(
              `failed to create activity in CRM for ${contactId}`,
              createCrmActivityResponse.ErrorMessage
            )
          } else {
            logger.info(
              'Created CRM activity with result:',
              createCrmActivityResponse
            )
          }

          const response = mapSubmissionToResponse(
            request,
            createdSubmission.toJSON()
          )

          return h.response(response).code(StatusCodes.CREATED)
        } catch (error) {
          return handleServerError('Error creating submission', error, h)
        }
      },
      validate: {
        payload: createSubmissionSchema
      },
      description: 'Create a submission',
      notes: 'Create a submission',
      tags: ['api', 'submissions']
    }
  },
  {
    method: 'GET',
    path: '/submissions/search/getByContactIdAndSeason',
    options: {
      /**
       * Get a submission by contactId and season from the database
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       *     @param {string} request.query.contact_id - The ID of the contact for which the submission is being retrieved.
       *     @param {string} request.query.season - The season year for which the submission is being retrieved.
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link Submission}
       */
      handler: async (request, h) => {
        const contactId = request.query.contact_id
        const season = request.query.season

        try {
          const foundSubmission = await Submission.findOne({
            where: {
              contactId,
              season
            }
          })

          if (foundSubmission) {
            const response = mapSubmissionToResponse(
              request,
              foundSubmission.toJSON()
            )
            return h.response(response).code(StatusCodes.OK)
          }
          return handleNotFound(
            `Submission not found for ${contactId} and ${season}`,
            h
          )
        } catch (error) {
          return handleServerError('Error finding submission', error, h)
        }
      },
      validate: {
        query: getSubmissionByContactAndSeasonSchema
      },
      description: 'Get a submission by contactId and season',
      notes: 'Get a submission by contactId and season',
      tags: ['api', 'submissions']
    }
  },
  {
    method: 'GET',
    path: '/submissions/{submissionId}/activities',
    options: {
      /**
       * Get all activities associated with a submission by its submission id from the database
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       *     @param {string} request.param.submissionId - The submission id of the associated activities
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link Submission}
       */
      handler: async (request, h) => {
        const submissionId = request.params.submissionId

        try {
          // Fetch the submission and associated activities in one call
          const submissionWithActivities = await Submission.findOne({
            where: {
              id: submissionId
            },
            include: [
              {
                model: Activity,
                required: false // Allows for submissions with no activities
              }
            ]
          })

          // If the submission does not exist, return 404
          if (!submissionWithActivities) {
            return handleNotFound(
              `Activities not found for submission with id ${submissionId}`,
              h
            )
          }

          // If no activities, return 200 with an empty array
          const foundActivities = submissionWithActivities.Activities
          if (!foundActivities || foundActivities.length === 0) {
            return h
              .response({ _embedded: { activities: [] } })
              .code(StatusCodes.OK)
          }

          const response = foundActivities.map((activity) =>
            mapActivityToResponse(request, activity.toJSON())
          )

          return h
            .response({ _embedded: { activities: response } })
            .code(StatusCodes.OK)
        } catch (error) {
          return handleServerError(
            'Error finding activities for submission',
            error,
            h
          )
        }
      },
      validate: {
        params: getBySubmissionIdSchema
      },
      description: 'Get all activities associated with a submission',
      notes: 'Get all activities associated with a submission',
      tags: ['api', 'submissions']
    }
  },
  {
    method: 'GET',
    path: '/submissions/{submissionId}',
    options: {
      /**
       * Get a submission by its submissionId from the database
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       *     @param {string} request.params.submissionId - The ID of the submission to be retrieved
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link Submission}
       */
      handler: async (request, h) => {
        const submissionId = request.params.submissionId

        try {
          const foundSubmission = await Submission.findOne({
            where: {
              id: submissionId
            }
          })

          if (foundSubmission) {
            const response = mapSubmissionToResponse(
              request,
              foundSubmission.toJSON()
            )
            return h.response(response).code(StatusCodes.OK)
          }
          return handleNotFound(`Submission not found ${submissionId}`, h)
        } catch (error) {
          return handleServerError('Error finding submission', error, h)
        }
      },
      validate: {
        params: getBySubmissionIdSchema
      },
      description: 'Get a submission by submissionId',
      notes: 'Get a submission by submissionId',
      tags: ['api', 'submissions']
    }
  },
  {
    method: 'PATCH',
    path: '/submissions/{submissionId}',
    options: {
      /**
       * Update a submission in the database using the submission ID
       *
       * @param {import('@hapi/hapi').Request request - The Hapi request object
       *     @param {string} request.params.submissionId - The ID of the submission to update
       * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
       * @returns {Promise<import('@hapi/hapi').ResponseObject>} - A response containing the target {@link Submission}
       */
      handler: async (request, h) => {
        const { submissionId } = request.params
        const { status, reportingExclude } = request.payload

        try {
          const submission = await Submission.findByPk(submissionId)

          if (!submission) {
            return handleNotFound(`Submission not found for ${submissionId}`, h)
          }

          // if a value is undefined, it is not updated by Sequelize
          const updatedSubmission = await submission.update({
            status,
            reportingExclude,
            version: new Date()
          })

          // Update CRM Activity if status is SUBMITTED
          if (status === STATUSES.SUBMITTED) {
            logger.info(
              'Updating CRM activity with request:',
              submission.contactId,
              submission.season
            )

            const updateCrmActivityResult = await updateActivity(
              submission.contactId,
              submission.season
            )

            if (updateCrmActivityResult.ErrorMessage) {
              logger.error(
                `failed to update activity in CRM for ${submission.contactId}`,
                updateCrmActivityResult.ErrorMessage
              )
            } else {
              logger.info(
                'Updated CRM activity with result:',
                updateCrmActivityResult
              )
            }
          }

          const mappedSubmission = mapSubmissionToResponse(
            request,
            updatedSubmission.toJSON()
          )

          return h.response(mappedSubmission).code(StatusCodes.OK)
        } catch (error) {
          return handleServerError('Error updating submission', error, h)
        }
      },
      validate: {
        payload: updateSubmissionSchema
      },
      description: 'Update a submission',
      notes: 'Update a submission',
      tags: ['api', 'submissions']
    }
  }
]
