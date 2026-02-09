import { unwrap } from '../promise-utils'

describe('unwrap', () => {
  it('returns the value when the promise is fulfilled', () => {
    const result = {
      status: 'fulfilled',
      value: 'success-value'
    }

    const output = unwrap(result)

    expect(output).toBe('success-value')
  })

  it('throws the reason when the promise is rejected', () => {
    const error = new Error('Something went wrong')
    const result = {
      status: 'rejected',
      reason: error
    }

    expect(() => unwrap(result)).toThrow(error)
  })

  it('throws non-Error rejection reasons as-is', () => {
    const result = {
      status: 'rejected',
      reason: 'failure'
    }

    expect(() => unwrap(result)).toThrow('failure')
  })
})
