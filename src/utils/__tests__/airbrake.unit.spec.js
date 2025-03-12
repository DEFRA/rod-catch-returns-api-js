import { Notifier } from '@airbrake/node'
import airbrake from '../airbrake.js'

jest.mock('@airbrake/node')

expect.extend({
  errorWithMessageMatching(received, ...matchers) {
    try {
      expect(received).toBeInstanceOf(Error)
      for (const matcher of matchers) {
        if (!matcher.asymmetricMatch(received.message)) {
          return {
            message: () => `expected ${matcher.toString()} to pass`,
            pass: false
          }
        }
      }
      return { pass: true }
    } catch (e) {
      return { message: () => e.message, pass: false }
    }
  }
})

describe('airbrake', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = {
      ...originalEnv
    }
    jest.resetAllMocks()
    airbrake.reset()
  })

  it('does not initialise airbrake if the required environment variables are missing', async () => {
    delete process.env.AIRBRAKE_HOST
    delete process.env.AIRBRAKE_PROJECT_KEY

    expect(airbrake.initialise()).toEqual(false)

    expect(Notifier).not.toHaveBeenCalled()
  })

  it('initialises airbrake if the required environment variables are present', async () => {
    expect(airbrake.initialise()).toEqual(true)

    expect(Notifier).toHaveBeenCalled()
  })

  it('intercepts console.error and reports to Airbrake', () => {
    const mockNotify = jest.fn()
    Notifier.mockImplementation(() => ({
      notify: mockNotify
    }))
    airbrake.initialise()

    const error = new Error('Test error')
    console.error(error)

    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(Error),
        params: expect.objectContaining({
          consoleInvocationDetails: expect.objectContaining({
            method: 'error',
            arguments: expect.arrayContaining([expect.any(String)])
          })
        })
      })
    )
  })

  it('intercepts console.warn and reports to Airbrake', () => {
    const mockNotify = jest.fn()
    Notifier.mockImplementation(() => ({
      notify: mockNotify
    }))
    airbrake.initialise()
    const warning = 'Test warning'

    console.warn(warning)

    // Ensure the notify method was called with the correct parameters
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(Error),
        params: expect.objectContaining({
          consoleInvocationDetails: expect.objectContaining({
            method: 'warn',
            arguments: expect.arrayContaining([
              expect.stringContaining(warning)
            ])
          })
        })
      })
    )
  })

  it('should output the request state in if it is present', () => {
    const mockNotify = jest.fn()
    Notifier.mockImplementation(() => ({
      notify: mockNotify
    }))

    airbrake.initialise()

    const requestDetail = { state: { sid: 'abc123' }, headers: {} }
    console.error(
      'Error processing request. Request: %j, Exception: %o',
      requestDetail,
      {}
    )
    expect(mockNotify).toHaveBeenLastCalledWith({
      error: expect.errorWithMessageMatching(expect.stringMatching('Error')),
      params: expect.objectContaining({
        consoleInvocationDetails: {
          arguments: expect.any(Object),
          method: 'error'
        }
      }),
      context: {},
      session: { sid: 'abc123' },
      environment: expect.any(Object)
    })
  })
})
