import { Catch, Submission } from '../../entities/index.js'
import {
  createCRMActivity,
  getCRMActivitiesContactById,
  getSubmission,
  getSubmissionByCatchId,
  handleCreateCrmActivity,
  handleUpdateCRMActivity,
  isSubmissionExistsById,
  isSubmissionExistsByUserAndSeason
} from '../submissions.service.js'
import {
  executeQuery,
  persist,
  rcrActivityForContact
} from '@defra-fish/dynamics-lib'
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

      const result = await isSubmissionExistsById(mockSubmissionId)

      expect(result).toBe(true)
    })

    it('should return false if submission does not exist', async () => {
      Submission.count.mockResolvedValue(0)

      const result = await isSubmissionExistsById(mockSubmissionId)

      expect(result).toBe(false)
    })

    it('should handle errors thrown by Submission.count', async () => {
      Submission.count.mockRejectedValue(new Error('Database error'))

      await expect(isSubmissionExistsById(mockSubmissionId)).rejects.toThrow(
        'Database error'
      )
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

      const result = await isSubmissionExistsByUserAndSeason(
        mockContactId,
        mockSeason
      )

      expect(result).toBe(true)
    })

    it('should return false if submission does not exist', async () => {
      Submission.count.mockResolvedValue(0)

      const result = await isSubmissionExistsByUserAndSeason(
        mockContactId,
        mockSeason
      )

      expect(result).toBe(false)
    })

    it('should handle errors thrown by Submission.count', async () => {
      Submission.count.mockRejectedValue(new Error('Database error'))

      await expect(
        isSubmissionExistsByUserAndSeason(mockContactId, mockSeason)
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

      const result = await getSubmission('123')

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

      const result = await getSubmission('123')

      expect(result).toBeNull()
    })

    it('should handle errors thrown by Submission.findOne', async () => {
      Submission.findOne.mockRejectedValue(new Error('Database error'))

      await expect(getSubmission('123')).rejects.toThrow('Database error')
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

      const result = await getSubmissionByCatchId('1')

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

      await expect(getSubmissionByCatchId('2')).rejects.toThrow(
        'Failed to fetch submission for catch ID 2: Error: No Catch found for catch ID 2'
      )
    })

    it('should throw an error if no activity is found for the catch ID', async () => {
      Catch.findOne.mockResolvedValue({})

      await expect(getSubmissionByCatchId('2')).rejects.toThrow(
        'Failed to fetch submission for catch ID 2: Error: No Activity found for catch ID 2'
      )
    })

    it('should throw an error if Catch.findOne fails', async () => {
      Catch.findOne.mockRejectedValue(new Error('Database error'))

      await expect(getSubmissionByCatchId('2')).rejects.toThrow(
        'Failed to fetch submission for catch ID 2: Error: Database error'
      )
    })
  })

  describe('handleCreateCrmActivity', () => {
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

    it('should not create an RCR CRM Activity if one already exists for the specified contact id and season', async () => {
      executeQuery.mockResolvedValue([{ id: 'existing' }])

      await handleCreateCrmActivity(mockContactId, mockSeason)

      expect(persist).not.toHaveBeenCalled()
      expect(logger.info).toHaveBeenNthCalledWith(
        3,
        'RCR CRM Activity already found for contactId=contact-123, season=2024 doing nothing'
      )
    })

    it('should create an RCR CRM activity if none exists for the specified contact id and season', async () => {
      executeQuery.mockResolvedValue([])
      persist.mockResolvedValueOnce(['abc-123'])

      await handleCreateCrmActivity(mockContactId, mockSeason)

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

    it('should throw if persist fails', async () => {
      executeQuery.mockResolvedValue([])

      persist.mockRejectedValue(new Error('CRM failure'))

      await expect(
        handleCreateCrmActivity(mockContactId, mockSeason)
      ).rejects.toThrow('CRM failure')
    })

    it('should log error a helpful error message indicating that the devs should check the database and crm if persist fails', async () => {
      executeQuery.mockResolvedValue([])

      persist.mockRejectedValue(new Error('CRM failure'))

      await expect(
        handleCreateCrmActivity(mockContactId, mockSeason)
      ).rejects.toThrow()

      expect(logger.error).toHaveBeenCalledWith(
        `Error creating RCR CRM Activity for contactId=${mockContactId}, season=${mockSeason}, please check the database and crm to see if the details match`
      )
    })
  })

  describe('getCRMActivitiesContactById', () => {
    const mockContactId = 'contact-123'
    const mockSeason = '2024'

    it('should return RCR CRM Activities for the given contact id and season', async () => {
      const mockActivities = [{ id: 'activity1' }, { id: 'activity2' }]
      executeQuery.mockResolvedValue(mockActivities)

      const result = await getCRMActivitiesContactById(
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
        getCRMActivitiesContactById(mockContactId, mockSeason)
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

    it('should persist a new RCRActivity', async () => {
      const mockPersistResult = [{ id: 'new-activity' }]
      persist.mockResolvedValue(mockPersistResult)

      await createCRMActivity(mockContactId, mockSeason)

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

    it('should return the id of the newly created RCRActivity', async () => {
      const mockPersistResult = 'new-activity'
      persist.mockResolvedValue([mockPersistResult])

      const result = await createCRMActivity(mockContactId, mockSeason)

      expect(result).toBe(mockPersistResult)
    })

    it('should throw and log an error if persist fails', async () => {
      persist.mockRejectedValue(new Error('CRM failure'))

      await expect(
        createCRMActivity(mockContactId, mockSeason)
      ).rejects.toThrow('CRM failure')
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Creating RCR CRM Activity')
      )
    })
  })

  describe('handleUpdateCRMActivity', () => {
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

    it('should update the CRM activity when exactly one activity exists', async () => {
      const mockActivity = {
        entity: {
          id: 'activity-123',
          status: 'STARTED',
          submittedDate: null
        }
      }
      executeQuery.mockResolvedValue([mockActivity])
      persist.mockResolvedValue()

      await handleUpdateCRMActivity(mockContactId, mockSeason)

      expect(persist).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'activity-123',
          status: 'SUBMITTED',
          submittedDate: new Date('2026-03-04T12:12:33.353Z')
        })
      ])

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining(
          `Updating RCR CRM Activities for: contactId=${mockContactId}, season=${mockSeason}`
        )
      )
    })

    it('should throw an error if no activities are found', async () => {
      executeQuery.mockResolvedValue([])

      await expect(
        handleUpdateCRMActivity(mockContactId, mockSeason)
      ).rejects.toThrow(
        `The number of RCR CRM Activities found for contactId=${mockContactId}, season=${mockSeason} is not 1 result=[]`
      )
    })

    it('should throw an error if more than one activity is found', async () => {
      const mockActivities = [
        { entity: { id: 'activity-1' } },
        { entity: { id: 'activity-2' } }
      ]

      executeQuery.mockResolvedValue(mockActivities)

      await expect(
        handleUpdateCRMActivity(mockContactId, mockSeason)
      ).rejects.toThrow(
        `The number of RCR CRM Activities found for contactId=${mockContactId}, season=${mockSeason} is not 1 result=${JSON.stringify(mockActivities)}`
      )
    })

    it('should log an error and throw if persist fails', async () => {
      const mockActivity = {
        entity: {
          id: 'activity-123',
          status: 'STARTED'
        }
      }

      executeQuery.mockResolvedValue([mockActivity])
      persist.mockRejectedValue(new Error('CRM failure'))

      await expect(
        handleUpdateCRMActivity(mockContactId, mockSeason)
      ).rejects.toThrow('CRM failure')

      expect(logger.error).toHaveBeenCalledWith(
        `Error updating RCR CRM Activity for contactId=${mockContactId}, season=${mockSeason}, please check the database and crm to see if the details match`
      )
    })
  })
})
