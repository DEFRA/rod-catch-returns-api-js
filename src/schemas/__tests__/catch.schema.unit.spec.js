import { createCatchSchema } from '../catch.schema.js'

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

    describe('activity', () => {
      it('should return an error if "activity" is missing', async () => {
        const payload = { ...getValidPayload(), activity: undefined }

        await expect(createCatchSchema.validateAsync(payload)).rejects.toThrow(
          'CATCH_ACTIVITY_REQUIRED'
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
    })
  })
})
