import { Catch, Submission } from '../../entities/index.js'
import * as submissionService from '../submissions.service.js'
import {
  executeQuery,
  persist,
  rcrActivityForContact
} from '@defra-fish/dynamics-lib'
import { getCreateActivityResponse } from '../../test-utils/test-data.js'
import logger from '../../utils/logger-utils.js'

jest.mock('../../entities/index.js')
jest.mock('../../utils/logger-utils.js')

describe('submission.service.unit', () => {
  describe('isSubmissionExistsById', () => {
    const mockSubmissionId = 'abc123'

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return true if submission exists', async () => {
      Submission.count.mockResolvedValue(1)

      const result =
        await submissionService.isSubmissionExistsById(mockSubmissionId)

      expect(result).toBe(true)
    })

    it('should return false if submission does not exist', async () => {
      Submission.count.mockResolvedValue(0)

      const result =
        await submissionService.isSubmissionExistsById(mockSubmissionId)

      expect(result).toBe(false)
    })

    it('should handle errors thrown by Submission.count', async () => {
      Submission.count.mockRejectedValue(new Error('Database error'))

      await expect(
        submissionService.isSubmissionExistsById(mockSubmissionId)
      ).rejects.toThrow('Database error')
    })
  })

  describe('isSubmissionExistsByUserAndSeason', () => {
    const mockContactId = 'abc123'
    const mockSeason = '2024'

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return true if submission exists', async () => {
      Submission.count.mockResolvedValue(1)

      const result = await submissionService.isSubmissionExistsByUserAndSeason(
        mockContactId,
        mockSeason
      )

      expect(result).toBe(true)
    })

    it('should return false if submission does not exist', async () => {
      Submission.count.mockResolvedValue(0)

      const result = await submissionService.isSubmissionExistsByUserAndSeason(
        mockContactId,
        mockSeason
      )

      expect(result).toBe(false)
    })

    it('should handle errors thrown by Submission.count', async () => {
      Submission.count.mockRejectedValue(new Error('Database error'))

      await expect(
        submissionService.isSubmissionExistsByUserAndSeason(
          mockContactId,
          mockSeason
        )
      ).rejects.toThrow('Database error')
    })
  })

  describe('getSubmission', () => {
    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return submission if found', async () => {
      const mockSubmission = {
        id: '1',
        contactId: 'contact-identifier-111',
        season: '2024',
        status: 'INCOMPLETE',
        source: 'WEB',
        version: '2024-10-10T13:13:11.000Z',
        reportingExclude: false,
        createdAt: '2024-10-10T13:13:11.000Z',
        updatedAt: '2024-10-10T13:13:11.000Z'
      }
      Submission.findOne.mockResolvedValue(mockSubmission)

      const result = await submissionService.getSubmission('123')

      expect(result).toEqual({
        id: '1',
        contactId: 'contact-identifier-111',
        season: '2024',
        status: 'INCOMPLETE',
        source: 'WEB',
        version: '2024-10-10T13:13:11.000Z',
        reportingExclude: false,
        createdAt: '2024-10-10T13:13:11.000Z',
        updatedAt: '2024-10-10T13:13:11.000Z'
      })
    })

    it('should return null if submission is not found', async () => {
      Submission.findOne.mockResolvedValue(null)

      const result = await submissionService.getSubmission('123')

      expect(result).toBeNull()
    })

    it('should handle errors thrown by Submission.findOne', async () => {
      Submission.findOne.mockRejectedValue(new Error('Database error'))

      await expect(submissionService.getSubmission('123')).rejects.toThrow(
        'Database error'
      )
    })
  })

  describe('getSubmissionByCatchId', () => {
    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return the submission if the catch with submission exists', async () => {
      Catch.findOne.mockResolvedValue({
        Activity: {
          daysFishedWithMandatoryRelease: 5,
          daysFishedOther: 3,
          river: 'rivers/456',
          Submission: {
            id: '1',
            contactId: 'contact-identifier-111',
            season: '2024',
            status: 'INCOMPLETE',
            source: 'WEB',
            version: '2024-10-10T13:13:11.000Z',
            reportingExclude: false,
            createdAt: '2024-10-10T13:13:11.000Z',
            updatedAt: '2024-10-10T13:13:11.000Z'
          }
        }
      })

      const result = await submissionService.getSubmissionByCatchId('1')

      expect(result).toStrictEqual({
        id: '1',
        contactId: 'contact-identifier-111',
        season: '2024',
        status: 'INCOMPLETE',
        source: 'WEB',
        version: '2024-10-10T13:13:11.000Z',
        reportingExclude: false,
        createdAt: '2024-10-10T13:13:11.000Z',
        updatedAt: '2024-10-10T13:13:11.000Z'
      })
    })

    it('should throw an error if no catch is found for the catch ID', async () => {
      Catch.findOne.mockResolvedValue(null)

      await expect(
        submissionService.getSubmissionByCatchId('2')
      ).rejects.toThrow(
        'Failed to fetch submission for catch ID 2: Error: No Catch found for catch ID 2'
      )
    })

    it('should throw an error if no activity is found for the catch ID', async () => {
      Catch.findOne.mockResolvedValue({})

      await expect(
        submissionService.getSubmissionByCatchId('2')
      ).rejects.toThrow(
        'Failed to fetch submission for catch ID 2: Error: No Activity found for catch ID 2'
      )
    })

    it('should throw an error if Catch.findOne fails', async () => {
      Catch.findOne.mockRejectedValue(new Error('Database error'))

      await expect(
        submissionService.getSubmissionByCatchId('2')
      ).rejects.toThrow(
        'Failed to fetch submission for catch ID 2: Error: Database error'
      )
    })
  })

  describe('handleCrmActivity', () => {
    const mockContactId = 'contact-123'
    const mockSeason = '2024'

    beforeEach(() => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2026-03-04T12:12:33.353Z'))
    })

    afterEach(() => {
      jest.useRealTimers()
      jest.clearAllMocks()
    })

    it('should not creare an RCR CRM Activity if one already exists', async () => {
      executeQuery.mockResolvedValue([{ id: 'existing' }])

      await submissionService.handleCrmActivity(mockContactId, mockSeason)

      expect(persist).not.toHaveBeenCalled()
      expect(logger.info).toHaveBeenNthCalledWith(
        3,
        'RCR CRM Activity already found for contactId=contact-123, season=2024 doing nothing'
      )
    })

    it('should create CRM activity if none exist', async () => {
      executeQuery.mockResolvedValue([])

      await submissionService.handleCrmActivity(mockContactId, mockSeason)

      expect(persist).toHaveBeenCalledWith([
        {
          bindToEntity: expect.any(Function),
          season: '2024',
          startDate: new Date('2026-03-04T12:12:33.353Z'),
          status: 'STARTED'
        }
      ])
      expect(logger.info).toHaveBeenNthCalledWith(
        3,
        'No RCR CRM Activities found for contactId=contact-123, season=2024 creating now'
      )
    })

    it('should log error and rethrow if createCRMActivity fails', async () => {
      executeQuery.mockResolvedValue([])

      persist.mockRejectedValue(new Error('CRM failure'))

      await expect(
        submissionService.handleCrmActivity(mockContactId, mockSeason)
      ).rejects.toThrow('CRM failure')

      expect(logger.error).toHaveBeenCalledWith(
        `Error creating RCR CRM Activity for contactId=${mockContactId}, season=${mockSeason}, please check the database and crm to see if the details match`
      )
    })
  })

  describe('getCRMActivitiesContactById', () => {
    const mockContactId = 'contact-123'
    const mockSeason = '2024'

    it('should return activities from executeQuery', async () => {
      const mockActivities = [{ id: 'activity1' }, { id: 'activity2' }]
      executeQuery.mockResolvedValue(mockActivities)

      const result = await submissionService.getCRMActivitiesContactById(
        mockContactId,
        mockSeason
      )

      expect(rcrActivityForContact).toHaveBeenCalledWith(
        mockContactId,
        mockSeason
      )
      expect(result).toEqual(mockActivities)
    })

    it('should throw if executeQuery rejects', async () => {
      executeQuery.mockRejectedValue(new Error('Database failure'))

      await expect(
        submissionService.getCRMActivitiesContactById(mockContactId, mockSeason)
      ).rejects.toThrow('Database failure')
    })
  })

  describe('createCRMActivity', () => {
    const mockContactId = 'contact-123'
    const mockSeason = '2024'

    beforeEach(() => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2026-03-04T12:12:33.353Z'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should create and persist a new RCRActivity', async () => {
      const mockPersistResult = [{ id: 'new-activity' }]
      persist.mockResolvedValue(mockPersistResult)

      const result = await submissionService.createCRMActivity(
        mockContactId,
        mockSeason
      )

      expect(persist).toHaveBeenCalledWith([
        expect.objectContaining({
          season: mockSeason,
          startDate: new Date('2026-03-04T12:12:33.353Z'),
          status: 'STARTED'
        })
      ])
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Creating RCR CRM Activity')
      )
    })

    it('should throw if persist fails', async () => {
      persist.mockRejectedValue(new Error('CRM failure'))

      await expect(
        submissionService.createCRMActivity(mockContactId, mockSeason)
      ).rejects.toThrow('CRM failure')
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Creating RCR CRM Activity')
      )
    })
  })
})
