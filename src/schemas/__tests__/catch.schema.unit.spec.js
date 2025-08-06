import {
  catchIdSchema,
  createCatchSchema,
  updateCatchActivityIdSchema,
  updateCatchSchema
} from '../catch.schema.js'
import { getCatchById } from '../../services/catches.service.js'
import { getSubmissionByActivityId } from '../../services/activities.service.js'
import { getSubmissionByCatchId } from '../../services/submissions.service.js'
import { isFMTOrAdmin } from '../../utils/auth-utils.js'
import { isMethodInternal } from '../../services/methods.service.js'
import { isSpeciesExists } from '../../services/species.service.js'

jest.mock('../../services/activities.service.js')
jest.mock('../../services/catches.service.js')
jest.mock('../../services/submissions.service.js')
jest.mock('../../services/methods.service.js')
jest.mock('../../services/species.service.js')
jest.mock('../../utils/auth-utils.js')

describe('catch.schema.unit', () => {
  describe('createCatchSchema', () => {
    const getValidPayload = (overrides = {}) => ({
      activity: 'activities/41001',
      dateCaught: '2024-08-02T00:00:00+01:00',
      species: 'species/1',
      mass: {
        kg: 2,
        oz: 71,
        type: 'METRIC'
      },
      method: 'methods/1',
      released: false,
      onlyMonthRecorded: false,
      noDateRecorded: false,
      reportingExclude: false,
      ...overrides
    })

    const setupMocks = ({
      season = 2024,
      methodInternal = false,
      speciesExists = true,
      fmtOrAdmin = false
    } = {}) => {
      getSubmissionByActivityId.mockResolvedValueOnce({ season })
      isMethodInternal.mockResolvedValue(methodInternal)
      isSpeciesExists.mockResolvedValueOnce(speciesExists)
      isFMTOrAdmin.mockReturnValueOnce(fmtOrAdmin)
    }

    afterEach(() => {
      jest.resetAllMocks()
    })

    describe('activity', () => {
      it('should return an error if "activity" is missing', async () => {
        const payload = getValidPayload({ activity: undefined })

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_ACTIVITY_REQUIRED'
        )
      })

      it('should return an error if "activity" does not start with "activities/"', async () => {
        const payload = getValidPayload({ activity: 'invalid/123' })

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_ACTIVITY_INVALID'
        )
      })
    })

    describe('dateCaught', () => {
      it('should return a CATCH_DEFAULT_DATE_REQUIRED if "dateCaught" is missing, noDateRecorded is true and onlyMonthRecorded is false', async () => {
        const payload = getValidPayload({
          dateCaught: undefined,
          noDateRecorded: true,
          onlyMonthRecorded: false
        })

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_DEFAULT_DATE_REQUIRED'
        )
      })

      it('should return a CATCH_DEFAULT_DATE_REQUIRED if "dateCaught" is missing, noDateRecorded is false and onlyMonthRecorded is true', async () => {
        const payload = getValidPayload({
          dateCaught: undefined,
          noDateRecorded: false,
          onlyMonthRecorded: true
        })

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_DEFAULT_DATE_REQUIRED'
        )
      })

      it('should return a CATCH_DATE_REQUIRED if "dateCaught" is missing, noDateRecorded is false and onlyMonthRecorded is false', async () => {
        const payload = getValidPayload({
          dateCaught: undefined,
          noDateRecorded: false,
          onlyMonthRecorded: false
        })

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_DATE_REQUIRED'
        )
      })

      it('should return a CATCH_DEFAULT_DATE_REQUIRED if "dateCaught" is null, noDateRecorded is false and onlyMonthRecorded is false', async () => {
        const payload = getValidPayload({
          dateCaught: null,
          noDateRecorded: false,
          onlyMonthRecorded: false
        })

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_DATE_REQUIRED'
        )
      })

      it('should return an error if the year for "dateCaught" does not match the year in the submission', async () => {
        setupMocks({ season: 2022 })
        const payload = getValidPayload({
          dateCaught: '2023-08-01T00:00:00+01:00'
        })

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_YEAR_MISMATCH'
        )
      })

      it('should validate successfully if "dateCaught" matches the year in the submission', async () => {
        setupMocks({ season: 2023 })
        const payload = getValidPayload({
          dateCaught: '2023-08-01T00:00:00+01:00'
        })

        await expect(
          createCatchSchema.validateAsync(payload)
        ).resolves.toStrictEqual(payload)
      })

      it('should return CATCH_DATE_IN_FUTURE if dateCaught is in the future', async () => {
        const futureDate = new Date()
        futureDate.setFullYear(futureDate.getFullYear() + 1)

        const payload = getValidPayload({
          dateCaught: futureDate.toISOString()
        })

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_DATE_IN_FUTURE'
        )
      })
    })

    describe('onlyMonthRecorded', () => {
      it('should return CATCH_NO_DATE_RECORDED_WITH_ONLY_MONTH_RECORDED if "onlyMonthRecorded" is true and "noDateRecorded" is true', async () => {
        const payload = getValidPayload({
          noDateRecorded: true,
          onlyMonthRecorded: true
        })

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_NO_DATE_RECORDED_WITH_ONLY_MONTH_RECORDED'
        )
      })

      it.each([undefined, true, false])(
        'should successfully validate if "onlyMonthRecorded" is %s',
        async (value) => {
          setupMocks()
          const payload = getValidPayload({ onlyMonthRecorded: value })

          await expect(
            createCatchSchema.validateAsync(payload)
          ).resolves.toStrictEqual(payload)
        }
      )
    })

    describe('noDateRecorded', () => {
      it.each([undefined, true, false])(
        'should successfully validate if "noDateRecorded" is %s',
        async (value) => {
          setupMocks()
          const payload = getValidPayload({ noDateRecorded: value })

          await expect(
            createCatchSchema.validateAsync(payload)
          ).resolves.toStrictEqual(payload)
        }
      )
    })

    describe('species', () => {
      it('should return CATCH_SPECIES_REQUIRED if "species" is undefined', async () => {
        const payload = getValidPayload({ species: undefined })

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_SPECIES_REQUIRED'
        )
      })

      it('should return CATCH_SPECIES_REQUIRED if "species" does not exists', async () => {
        setupMocks({ speciesExists: false })
        const payload = getValidPayload({ species: 'species/10' })

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_SPECIES_REQUIRED'
        )
      })
    })

    describe('mass', () => {
      it('should return a CATCH_MASS_REQUIRED if "mass" is undefined', async () => {
        const payload = getValidPayload({ mass: undefined })

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_MASS_REQUIRED'
        )
      })

      it('should return a CATCH_MASS_TYPE_INVALID if "mass.type" is invalid', async () => {
        const payload = getValidPayload({
          mass: {
            kg: 2,
            oz: 1,
            type: 'invalid'
          }
        })

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_MASS_TYPE_INVALID'
        )
      })

      it('should return a CATCH_MASS_BELOW_MINIMUM if "mass.kg" is negative', async () => {
        const payload = getValidPayload({
          mass: {
            kg: -2,
            oz: 1,
            type: 'METRIC'
          }
        })

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_MASS_BELOW_MINIMUM'
        )
      })

      it('should return a CATCH_MASS_MAX_EXCEEDED if "mass.kg" is over 50kg', async () => {
        const payload = getValidPayload({
          mass: {
            kg: 51,
            oz: 1,
            type: 'METRIC'
          }
        })

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_MASS_MAX_EXCEEDED'
        )
      })

      it('should return a CATCH_MASS_BELOW_MINIMUM if "mass.oz" is negative', async () => {
        const payload = getValidPayload({
          mass: {
            kg: 5,
            oz: -2,
            type: 'IMPERIAL'
          }
        })

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_MASS_BELOW_MINIMUM'
        )
      })

      it('should return a CATCH_MASS_MAX_EXCEEDED if "mass.oz" is over 1763.698097oz', async () => {
        const payload = getValidPayload({
          mass: {
            kg: 5,
            oz: 1764,
            type: 'IMPERIAL'
          }
        })

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_MASS_MAX_EXCEEDED'
        )
      })

      it('should return a CATCH_MASS_KG_REQUIRED if "mass.kg" is undefined and "mass.type" is METRIC', async () => {
        const payload = getValidPayload({
          mass: {
            kg: undefined,
            oz: 5,
            type: 'METRIC'
          }
        })

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_MASS_KG_REQUIRED'
        )
      })

      it('should return a CATCH_MASS_OZ_REQUIRED if "mass.oz" is undefined and "mass.type" is IMPERIAL', async () => {
        const payload = getValidPayload({
          mass: {
            kg: 3,
            oz: undefined,
            type: 'IMPERIAL'
          }
        })

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_MASS_OZ_REQUIRED'
        )
      })
    })

    describe('method', () => {
      it('should return an error if "method" is missing', async () => {
        const payload = getValidPayload({ method: undefined })

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_METHOD_REQUIRED'
        )
      })

      it('should return an error if "method" does not start with "methods/"', async () => {
        const payload = getValidPayload({ method: 'invalid/123' })

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_METHOD_INVALID'
        )
      })

      it('should return an error if "method" is restricted and the user is not an admin or fmt', async () => {
        setupMocks({ methodInternal: true })
        const payload = getValidPayload({ method: 'methods/4' })

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_METHOD_FORBIDDEN'
        )
      })

      it('should validate successfully if "method" is restricted and the user is an admin or fmt', async () => {
        setupMocks({ methodInternal: true, fmtOrAdmin: true })
        const payload = getValidPayload({ method: 'methods/4' })

        await expect(
          createCatchSchema.validateAsync(payload)
        ).resolves.toStrictEqual(payload)
      })
    })

    describe('released', () => {
      it('should return an error if "released" is missing', async () => {
        const payload = getValidPayload({ released: undefined })

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_RELEASED_REQUIRED'
        )
      })

      it.each([true, false])(
        'should successfully validate if "released" is %s',
        async (value) => {
          setupMocks()
          const payload = getValidPayload({ released: value })

          await expect(
            createCatchSchema.validateAsync(payload)
          ).resolves.toStrictEqual(payload)
        }
      )
    })

    describe('reportingExclude', () => {
      it.each([true, false])(
        'should successfully validate if "reportingExclude" is %s',
        async (value) => {
          setupMocks()
          const payload = getValidPayload({ reportingExclude: value })

          await expect(
            createCatchSchema.validateAsync(payload)
          ).resolves.toStrictEqual(payload)
        }
      )

      it('should default to false if undefined', async () => {
        setupMocks()
        const payload = getValidPayload({ reportingExclude: undefined })

        await expect(
          createCatchSchema.validateAsync(payload)
        ).resolves.toStrictEqual({
          activity: 'activities/41001',
          dateCaught: '2024-08-02T00:00:00+01:00',
          mass: {
            kg: 2,
            oz: 71,
            type: 'METRIC'
          },
          method: 'methods/1',
          noDateRecorded: false,
          onlyMonthRecorded: false,
          released: false,
          reportingExclude: false,
          species: 'species/1'
        })
      })
    })
  })

  describe('catchIdSchema', () => {
    it('should validate successfully when "catchId" is provided and valid', () => {
      const params = { catchId: 123 }
      const { error } = catchIdSchema.validate(params)

      expect(error).toBeUndefined()
    })

    it('should return an error if "catchId" is missing', () => {
      const params = { catchId: undefined }
      const { error } = catchIdSchema.validate(params)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('"catchId" is required')
    })

    it('should return an error if "catchId" is not a number', () => {
      const params = { catchId: 'abc' }
      const { error } = catchIdSchema.validate(params)

      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('"catchId" must be a number')
    })
  })

  describe('updateCatchSchema', () => {
    const getDefaultContext = () => ({
      context: {
        params: {
          catchId: '12345'
        }
      }
    })

    const getValidPayload = (overrides = {}) => ({
      dateCaught: '2024-08-02T00:00:00+01:00',
      species: 'species/1',
      mass: {
        kg: 2,
        oz: 71,
        type: 'METRIC'
      },
      method: 'methods/1',
      released: false,
      onlyMonthRecorded: true,
      noDateRecorded: false,
      ...overrides
    })

    const setupMocks = ({
      season = 2024,
      methodInternal = false,
      onlyMonthRecorded = true,
      noDateRecorded = false,
      dateCaught = '2024-08-02T00:00:00+01:00',
      speciesExists = true,
      fmtOrAdmin = false
    } = {}) => {
      getSubmissionByCatchId.mockResolvedValueOnce({ season })
      isMethodInternal.mockResolvedValueOnce(methodInternal)
      getCatchById.mockResolvedValueOnce({
        onlyMonthRecorded,
        noDateRecorded,
        dateCaught
      })
      isSpeciesExists.mockResolvedValueOnce(speciesExists)
      isFMTOrAdmin.mockReturnValue(fmtOrAdmin)
    }

    afterEach(() => {
      jest.resetAllMocks()
    })

    describe('dateCaught', () => {
      it('should return an error if the year for "dateCaught" does not match the year in the submission', async () => {
        setupMocks({ season: 2022 })
        const payload = getValidPayload({
          dateCaught: '2023-08-01T00:00:00+01:00'
        })

        await expect(
          updateCatchSchema.validateAsync(payload, getDefaultContext())
        ).rejects.toThrow('CATCH_YEAR_MISMATCH')
      })

      it('should validate successfully if "dateCaught" matches the year in the submission', async () => {
        setupMocks({ season: 2023 })
        const payload = getValidPayload({
          dateCaught: '2023-08-01T00:00:00+01:00'
        })

        await expect(
          updateCatchSchema.validateAsync(payload, getDefaultContext())
        ).resolves.toStrictEqual(payload)
      })

      it('should return CATCH_DATE_IN_FUTURE if dateCaught is in the future', async () => {
        setupMocks({ season: 2024 })
        const futureDate = new Date()
        futureDate.setFullYear(futureDate.getFullYear() + 1)

        const payload = getValidPayload({
          dateCaught: futureDate.toISOString()
        })

        await expect(
          updateCatchSchema.validateAsync(payload, getDefaultContext())
        ).rejects.toThrow('CATCH_DATE_IN_FUTURE')
      })
    })

    describe('species', () => {
      it('should return an error if "species" does not match the required format', async () => {
        const payload = getValidPayload({ species: 'invalid/1' })

        await expect(
          updateCatchSchema.validateAsync(payload, getDefaultContext())
        ).rejects.toThrow('CATCH_SPECIES_INVALID')
      })

      it('should return an error if the "species" does not exist', async () => {
        setupMocks({ speciesExists: false })
        const payload = { species: 'species/10' }

        await expect(
          updateCatchSchema.validateAsync(payload, getDefaultContext())
        ).rejects.toThrow('CATCH_SPECIES_REQUIRED')
      })

      it('should validate successfully if "species" is valid', async () => {
        setupMocks()
        const payload = { species: 'species/2' }

        await expect(
          updateCatchSchema.validateAsync(payload, getDefaultContext())
        ).resolves.toStrictEqual(payload)
      })
    })

    describe('mass', () => {
      it('should return a CATCH_MASS_TYPE_INVALID if "mass.type" is invalid', async () => {
        const payload = getValidPayload({
          mass: {
            kg: 2,
            oz: 1,
            type: 'invalid'
          }
        })

        await expect(updateCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_MASS_TYPE_INVALID'
        )
      })

      it('should return a CATCH_MASS_BELOW_MINIMUM if "mass.kg" is negative', async () => {
        const payload = getValidPayload({
          mass: {
            kg: -2,
            oz: 1,
            type: 'METRIC'
          }
        })

        await expect(updateCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_MASS_BELOW_MINIMUM'
        )
      })

      it('should return a CATCH_MASS_BELOW_MINIMUM if "mass.kg" is 0', async () => {
        const payload = getValidPayload({
          mass: {
            kg: 0,
            oz: 1,
            type: 'METRIC'
          }
        })

        await expect(updateCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_MASS_BELOW_MINIMUM'
        )
      })

      it('should return a CATCH_MASS_MAX_EXCEEDED if "mass.kg" is over 50kg', async () => {
        const payload = getValidPayload({
          mass: {
            kg: 51,
            oz: 1,
            type: 'METRIC'
          }
        })

        await expect(updateCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_MASS_MAX_EXCEEDED'
        )
      })

      it('should return a CATCH_MASS_BELOW_MINIMUM if "mass.oz" is negative', async () => {
        const payload = getValidPayload({
          mass: {
            kg: 5,
            oz: -2,
            type: 'IMPERIAL'
          }
        })

        await expect(updateCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_MASS_BELOW_MINIMUM'
        )
      })

      it('should return a CATCH_MASS_BELOW_MINIMUM if "mass.oz" is 0', async () => {
        const payload = getValidPayload({
          mass: {
            kg: 5,
            oz: 0,
            type: 'IMPERIAL'
          }
        })

        await expect(updateCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_MASS_BELOW_MINIMUM'
        )
      })

      it('should return a CATCH_MASS_MAX_EXCEEDED if "mass.oz" is over 1763.698097oz', async () => {
        const payload = getValidPayload({
          mass: {
            kg: 5,
            oz: 1764,
            type: 'IMPERIAL'
          }
        })

        await expect(updateCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_MASS_MAX_EXCEEDED'
        )
      })

      it('should return a CATCH_MASS_KG_REQUIRED if "mass.kg" is undefined and "mass.type" is METRIC', async () => {
        const payload = getValidPayload({
          mass: {
            kg: undefined,
            oz: 5,
            type: 'METRIC'
          }
        })

        await expect(updateCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_MASS_KG_REQUIRED'
        )
      })

      it('should return a CATCH_MASS_OZ_REQUIRED if "mass.oz" is undefined and "mass.type" is IMPERIAL', async () => {
        const payload = getValidPayload({
          mass: {
            kg: 3,
            oz: undefined,
            type: 'IMPERIAL'
          }
        })

        await expect(updateCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_MASS_OZ_REQUIRED'
        )
      })

      it('should validate successfully if "mass" is valid', async () => {
        setupMocks()
        const payload = {
          kg: 2,
          oz: 1,
          type: 'IMPERIAL'
        }

        await expect(
          updateCatchSchema.validateAsync(payload, getDefaultContext())
        ).resolves.toStrictEqual(payload)
      })
    })

    describe('method', () => {
      it('should return an error if "method" does not start with "methods/"', async () => {
        const payload = getValidPayload({ method: 'invalid/123' })

        await expect(
          updateCatchSchema.validateAsync(payload, getDefaultContext())
        ).rejects.toThrow('CATCH_METHOD_INVALID')
      })

      it('should validate successfully if "method" is valid', async () => {
        setupMocks()
        const payload = { method: 'methods/1' }

        await expect(
          updateCatchSchema.validateAsync(payload, getDefaultContext())
        ).resolves.toStrictEqual(payload)
      })

      it('should return an error if "method" is restricted and the user is not an admin or fmt', async () => {
        setupMocks({ methodInternal: true })
        const payload = { method: 'methods/4' }

        await expect(
          updateCatchSchema.validateAsync(payload, getDefaultContext())
        ).rejects.toThrow('CATCH_METHOD_FORBIDDEN')
      })

      it('should validate successfully if "method" is restricted and the user is an admin or fmt', async () => {
        setupMocks({ methodInternal: true, fmtOrAdmin: true })
        const payload = { method: 'methods/4' }

        await expect(
          updateCatchSchema.validateAsync(payload, getDefaultContext())
        ).resolves.toStrictEqual(payload)
      })
    })

    describe('released', () => {
      it('should return an error if "released" is invalid', async () => {
        const payload = getValidPayload({ released: 'test' })

        await expect(updateCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_RELEASED_REQUIRED'
        )
      })

      it.each([undefined, true, false])(
        'should successfully validate if "released" is %s',
        async (value) => {
          setupMocks()
          const payload = getValidPayload({ released: value })

          await expect(
            updateCatchSchema.validateAsync(payload, getDefaultContext())
          ).resolves.toStrictEqual(payload)
        }
      )
    })

    describe('onlyMonthRecorded', () => {
      it('should return an error if "onlyMonthRecorded" is invalid', async () => {
        const payload = getValidPayload({ onlyMonthRecorded: 'test' })

        await expect(updateCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_ONLY_MONTH_RECORDED_REQUIRED'
        )
      })

      it.each([undefined, true, false])(
        'should successfully validate if "onlyMonthRecorded" is %s',
        async (value) => {
          setupMocks()
          const payload = getValidPayload({
            onlyMonthRecorded: value,
            noDateRecorded: false
          })

          await expect(
            updateCatchSchema.validateAsync(payload, getDefaultContext())
          ).resolves.toStrictEqual(payload)
        }
      )

      it('should return an error if "onlyMonthRecorded" and "noDateRecorded" is true', async () => {
        const payload = getValidPayload({
          noDateRecorded: true,
          onlyMonthRecorded: true
        })

        await expect(
          updateCatchSchema.validateAsync(payload, getDefaultContext())
        ).rejects.toThrow('CATCH_NO_DATE_RECORDED_WITH_ONLY_MONTH_RECORDED')
      })
    })

    describe('noDateRecorded', () => {
      it('should return an error if "noDateRecorded" is invalid', async () => {
        const payload = getValidPayload({ noDateRecorded: 'test' })

        await expect(updateCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_NO_DATE_RECORDED_REQUIRED'
        )
      })

      it.each([undefined, true, false])(
        'should successfully validate if "noDateRecorded" is %s',
        async (value) => {
          setupMocks()
          const payload = getValidPayload({
            noDateRecorded: value,
            onlyMonthRecorded: false
          })

          await expect(
            updateCatchSchema.validateAsync(payload, getDefaultContext())
          ).resolves.toStrictEqual(payload)
        }
      )
    })
    describe('reportingExclude', () => {
      it.each([undefined, true, false])(
        'should successfully validate if "reportingExclude" is %s',
        async (value) => {
          setupMocks()
          const payload = getValidPayload({ reportingExclude: value })

          await expect(
            updateCatchSchema.validateAsync(payload, getDefaultContext())
          ).resolves.toStrictEqual(payload)
        }
      )
    })
  })

  describe('updateCatchActivityIdSchema', () => {
    it('should validate successfully if activity is valid', async () => {
      const activity = 'activities/101'
      await expect(
        updateCatchActivityIdSchema.validateAsync(activity)
      ).resolves.toStrictEqual(activity)
    })

    it('should return an error if "activity" is missing', async () => {
      await expect(
        updateCatchActivityIdSchema.validateAsync(undefined)
      ).rejects.toThrow('CATCH_ACTIVITY_REQUIRED')
    })

    it('should return an error if "activity" does not start with "activities/"', async () => {
      await expect(
        updateCatchActivityIdSchema.validateAsync('invalid/123')
      ).rejects.toThrow('CATCH_ACTIVITY_INVALID')
    })
  })
})
