import { createCatchSchema } from '../catch.schema.js'
import { getSubmissionByActivityId } from '../../services/activities.service.js'
import { isMethodInternal } from '../../services/methods.service.js'

jest.mock('../../services/activities.service.js')
jest.mock('../../services/methods.service.js')

describe('catch.schema.unit', () => {
  describe('createCatchSchema', () => {
    const getValidPayload = () => ({
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
      noDateRecorded: false
    })

    const setupMocks = ({ season = 2024, methodInternal = false } = {}) => {
      getSubmissionByActivityId.mockResolvedValueOnce({ season })
      isMethodInternal.mockResolvedValue(methodInternal)
    }

    describe('activity', () => {
      it('should return an error if "activity" is missing', async () => {
        const payload = { ...getValidPayload(), activity: undefined }

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_ACTIVITY_REQUIRED'
        )
      })

      it('should return an error if "activity" does not start with "activities/"', async () => {
        const payload = { ...getValidPayload(), activity: 'invalid/123' }

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_ACTIVITY_INVALID'
        )
      })
    })

    describe('dateCaught', () => {
      it('should return a CATCH_DEFAULT_DATE_REQUIRED if "dateCaught" is missing, noDateRecorded is true and onlyMonthRecorded is false', async () => {
        const payload = {
          ...getValidPayload(),
          dateCaught: undefined,
          noDateRecorded: true,
          onlyMonthRecorded: false
        }

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_DEFAULT_DATE_REQUIRED'
        )
      })

      it('should return a CATCH_DEFAULT_DATE_REQUIRED if "dateCaught" is missing, noDateRecorded is false and onlyMonthRecorded is true', async () => {
        const payload = {
          ...getValidPayload(),
          dateCaught: undefined,
          noDateRecorded: false,
          onlyMonthRecorded: true
        }

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_DEFAULT_DATE_REQUIRED'
        )
      })

      it('should return a CATCH_DATE_REQUIRED if "dateCaught" is missing, noDateRecorded is false and onlyMonthRecorded is false', async () => {
        const payload = {
          ...getValidPayload(),
          dateCaught: undefined,
          noDateRecorded: false,
          onlyMonthRecorded: false
        }

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_DATE_REQUIRED'
        )
      })

      it('should return an error if the year for "dateCaught" does not match the year in the submission', async () => {
        setupMocks({ season: 2022 })
        const payload = {
          ...getValidPayload(),
          dateCaught: '2023-08-01T00:00:00+01:00'
        }

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_YEAR_MISMATCH'
        )
      })

      it('should validate successfully if "dateCaught" matches the year in the submission', async () => {
        setupMocks({ season: 2023 })
        const payload = {
          ...getValidPayload(),
          dateCaught: '2023-08-01T00:00:00+01:00'
        }

        await expect(
          createCatchSchema.validateAsync(payload)
        ).resolves.toStrictEqual(payload)
      })

      it('should return CATCH_DATE_IN_FUTURE if dateCaught is in the future', async () => {
        const futureDate = new Date()
        futureDate.setFullYear(futureDate.getFullYear() + 1)

        const payload = {
          ...getValidPayload(),
          dateCaught: futureDate.toISOString()
        }

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_DATE_IN_FUTURE'
        )
      })
    })

    describe('onlyMonthRecorded', () => {
      it('should return CATCH_NO_DATE_RECORDED_WITH_ONLY_MONTH_RECORDED if "onlyMonthRecorded" is true and "noDateRecorded" is true', async () => {
        const payload = {
          ...getValidPayload(),
          noDateRecorded: true,
          onlyMonthRecorded: true
        }

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_NO_DATE_RECORDED_WITH_ONLY_MONTH_RECORDED'
        )
      })

      it.each([undefined, true, false])(
        'should successfully validate if "onlyMonthRecorded" is %s',
        async (value) => {
          setupMocks()
          const payload = { ...getValidPayload(), onlyMonthRecorded: value }

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
          const payload = { ...getValidPayload(), noDateRecorded: value }

          await expect(
            createCatchSchema.validateAsync(payload)
          ).resolves.toStrictEqual(payload)
        }
      )
    })

    describe('species', () => {
      it('should return CATCH_SPECIES_REQUIRED if "species" is undefined', async () => {
        const payload = {
          ...getValidPayload(),
          species: undefined
        }

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_SPECIES_REQUIRED'
        )
      })
    })

    describe('mass', () => {
      it('should return a CATCH_MASS_REQUIRED if "mass" is undefined', async () => {
        const payload = {
          ...getValidPayload(),
          mass: undefined
        }

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_MASS_REQUIRED'
        )
      })

      it('should return a CATCH_MASS_TYPE_INVALID if "mass.type" is invalid', async () => {
        const payload = {
          ...getValidPayload(),
          mass: {
            kg: 2,
            oz: 1,
            type: 'invalid'
          }
        }

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_MASS_TYPE_INVALID'
        )
      })

      it('should return a CATCH_MASS_BELOW_MINIMUM if "mass.kg" is negative', async () => {
        const payload = {
          ...getValidPayload(),
          mass: {
            kg: -2,
            oz: 1,
            type: 'METRIC'
          }
        }

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_MASS_BELOW_MINIMUM'
        )
      })

      it('should return a CATCH_MASS_MAX_EXCEEDED if "mass.kg" is over 50kg', async () => {
        const payload = {
          ...getValidPayload(),
          mass: {
            kg: 51,
            oz: 1,
            type: 'METRIC'
          }
        }

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_MASS_MAX_EXCEEDED'
        )
      })

      it('should return a CATCH_MASS_BELOW_MINIMUM if "mass.oz" is negative', async () => {
        const payload = {
          ...getValidPayload(),
          mass: {
            kg: 5,
            oz: -2,
            type: 'IMPERIAL'
          }
        }

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_MASS_BELOW_MINIMUM'
        )
      })

      it('should return a CATCH_MASS_MAX_EXCEEDED if "mass.oz" is over 1763.698097oz', async () => {
        const payload = {
          ...getValidPayload(),
          mass: {
            kg: 5,
            oz: 1764,
            type: 'IMPERIAL'
          }
        }

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_MASS_MAX_EXCEEDED'
        )
      })

      it('should return a CATCH_MASS_KG_REQUIRED if "mass.kg" is undefined and "mass.type" is METRIC', async () => {
        const payload = {
          ...getValidPayload(),
          mass: {
            kg: undefined,
            oz: 5,
            type: 'METRIC'
          }
        }

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_MASS_KG_REQUIRED'
        )
      })

      it('should return a CATCH_MASS_OZ_REQUIRED if "mass.oz" is undefined and "mass.type" is IMPERIAL', async () => {
        const payload = {
          ...getValidPayload(),
          mass: {
            kg: 3,
            oz: undefined,
            type: 'IMPERIAL'
          }
        }

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_MASS_OZ_REQUIRED'
        )
      })
    })

    describe('method', () => {
      it('should return an error if "method" is missing', async () => {
        const payload = { ...getValidPayload(), method: undefined }

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_METHOD_REQUIRED'
        )
      })

      it('should return an error if "method" does not start with "methods/"', async () => {
        const payload = { ...getValidPayload(), method: 'invalid/123' }

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_METHOD_INVALID'
        )
      })

      it('should return an error if "method" is restricted', async () => {
        setupMocks({ methodInternal: true })
        const payload = { ...getValidPayload(), method: 'methods/4' }

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_METHOD_FORBIDDEN'
        )
      })
    })

    describe('released', () => {
      it('should return an error if "released" is missing', async () => {
        const payload = { ...getValidPayload(), released: undefined }

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_RELEASED_REQUIRED'
        )
      })

      it.each([true, false])(
        'should successfully validate if "released" is %s',
        async (value) => {
          setupMocks()
          const payload = { ...getValidPayload(), released: value }

          await expect(
            createCatchSchema.validateAsync(payload)
          ).resolves.toStrictEqual(payload)
        }
      )
    })

    describe('reportingExclude', () => {
      it.each([undefined, true, false])(
        'should successfully validate if "reportingExclude" is %s',
        async (value) => {
          setupMocks()
          const payload = { ...getValidPayload(), reportingExclude: value }

          await expect(
            createCatchSchema.validateAsync(payload)
          ).resolves.toStrictEqual(payload)
        }
      )
    })
  })
})
