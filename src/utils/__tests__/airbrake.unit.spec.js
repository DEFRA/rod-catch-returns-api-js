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
  let mockNotify
  let mockFlush
  let mockClose

  beforeEach(() => {
    process.env = {
      ...originalEnv
    }
    process.env.AIRBRAKE_HOST = 'https://test-airbrake.com'
    process.env.AIRBRAKE_PROJECT_KEY = '123'
    airbrake.reset()

    // Mocking es6 class in jest.mock('@airbrake/node') does not work, this is a workaround
    mockNotify = jest.fn()
    mockFlush = jest.fn()
    mockClose = jest.fn()
    Notifier.mockImplementation(() => ({
      notify: mockNotify,
      flush: mockFlush,
      close: mockClose
    }))
  })

  afterEach(() => {
    jest.clearAllMocks()
    process.removeAllListeners('uncaughtExceptionMonitor')
    process.removeAllListeners('uncaughtException')
    process.removeAllListeners('unhandledRejection')
  })

  describe('initialise', () => {
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
      airbrake.initialise()
      const warning = 'Test warning'

      console.warn(warning)

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

    it.each([
      [
        'should output the request state if it is present',
        { state: { sid: 'abc123' }, headers: {} },
        { session: { sid: 'abc123' }, context: {} }
      ],
      [
        'should output the request path in the context object if it is present',
        { method: 'GET', path: '/path', headers: {} },
        { context: { action: 'GET /path' } }
      ],
      [
        'should output the user agent in the context object if it is present',
        { headers: { 'user-agent': 'chrome' } },
        { context: { userAgent: 'chrome' } }
      ]
    ])('%s', (_, requestDetail, expectedContext) => {
      airbrake.initialise()

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
        environment: expect.any(Object),
        ...expectedContext
      })
    })

    it('should output the environment if process.env.name is present', () => {
      process.env.name = 'test'
      airbrake.initialise()

      console.error(
        'Error processing request. Request: %j, Exception: %o',
        {},
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
        environment: { name: 'test' }
      })
    })

    it.each([
      [['A single string'], 'A single string'],
      [
        ['A string with %d %s arguments', 2, 'formatting'],
        'A string with 2 formatting arguments'
      ],
      [
        ['Test', 'multiple', 'strings', 'with', 'no', 'format'],
        'Test multiple strings with no format'
      ],
      [[new Error('Test error pos 1'), 'another string'], 'Test error pos 1'],
      [['another string', new Error('Test error pos 2')], 'Test error pos 2']
    ])(
      'formats the error message in a consistent manner with the native console.error call: [%j] === %s',
      async (input, output) => {
        airbrake.initialise()

        console.error(...input)

        expect(mockNotify).toHaveBeenLastCalledWith({
          error: expect.errorWithMessageMatching(expect.stringMatching(output)),
          params: expect.objectContaining({
            consoleInvocationDetails: {
              arguments: expect.any(Object),
              method: 'error'
            }
          }),
          context: {},
          environment: expect.any(Object)
        })
      }
    )

    it('hooks the process for uncaughtExceptions', async () => {
      const processExitSpy = jest
        .spyOn(process, 'exit')
        .mockImplementation(jest.fn())
      airbrake.initialise()

      const testError = new Error('Test error')
      process.emit('uncaughtException', testError)

      await new Promise((resolve) => setImmediate(resolve))

      expect(mockFlush).toHaveBeenCalled()
      expect(processExitSpy).toHaveBeenCalledWith(1)
    })

    it.each([['uncaughtException'], ['unhandledRejection']])(
      'hooks the process for %s',
      async (event) => {
        const processExitSpy = jest
          .spyOn(process, 'exit')
          .mockImplementation(jest.fn())
        airbrake.initialise()

        const testError = new Error('Test error')
        process.emit(event, testError)

        await new Promise((resolve) => setImmediate(resolve))

        expect(mockFlush).toHaveBeenCalled()
        expect(processExitSpy).toHaveBeenCalledWith(1)
      }
    )
  })

  describe('flush', () => {
    it('should flush and close Notifier, when airbrake is flushed, if it is initialised', async () => {
      airbrake.initialise()
      await airbrake.flush()

      expect(mockFlush).toHaveBeenCalled()
      expect(mockClose).toHaveBeenCalled()
    })
  })

  describe('attachAirbrakeToDebugLogger', () => {
    it('returns the log function when airbrake is not available', () => {
      const mockLogFunction = jest.fn()
      const logFunction = airbrake.attachAirbrakeToDebugLogger(mockLogFunction)

      logFunction('test message')

      expect(mockLogFunction).toHaveBeenCalledWith('test message')
      expect(mockNotify).not.toHaveBeenCalled()
    })

    it('attaches Airbrake reporting to the log function when airbrake is available', () => {
      const mockLogFunction = jest.fn()
      airbrake.initialise()
      const logFunction = airbrake.attachAirbrakeToDebugLogger(mockLogFunction)

      logFunction('test message')

      expect(mockLogFunction).toHaveBeenCalledWith('test message')
      expect(mockNotify).toHaveBeenCalled()
    })

    it('passes all arguments to both notify and the log function', () => {
      const mockLogFunction = jest.fn()
      mockLogFunction.namespace = 'testNamespace'
      airbrake.initialise()
      const logFunction = airbrake.attachAirbrakeToDebugLogger(mockLogFunction)

      logFunction('test message', 123, { some: 'object' })

      expect(mockLogFunction).toHaveBeenCalledWith('test message', 123, {
        some: 'object'
      })
      expect(mockNotify).toHaveBeenCalledWith({
        error: expect.errorWithMessageMatching(
          expect.stringMatching('test message')
        ),
        params: expect.objectContaining({
          consoleInvocationDetails: {
            arguments: expect.any(Object),
            method: 'testNamespace'
          }
        }),
        context: {},
        environment: {}
      })
    })
  })
})
