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
  })
})
