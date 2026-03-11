import { JoiExternalValidationError } from '../joi-external-validation-error.model'

describe('JoiExternalValidationError', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should set the error message to the provided code', () => {
    const error = new JoiExternalValidationError('TEST_CODE')

    expect(error.message).toBe('TEST_CODE')
  })

  it('should set the code property', () => {
    const error = new JoiExternalValidationError('TEST_CODE')

    expect(error.code).toBe('TEST_CODE')
  })

  it('should set the context property when provided', () => {
    const context = { property: 'river', value: '123' }

    const error = new JoiExternalValidationError('TEST_CODE', context)

    expect(error.context).toEqual(context)
  })
})
