import { formatWithOptions, inspect } from 'util'
import { Notifier } from '@airbrake/node'

const INSPECT_OPTS = {
  depth: null,
  maxStringLength: null,
  maxArrayLength: null,
  breakLength: null,
  compact: true,
  showHidden: true,
  errorNotifications: true
}

/** @type {Notifier} */
let airbrake = null

/**
 * Resets the Airbrake notifier instance.
 */
const reset = () => {
  airbrake = null
}

/**
 * Reports a console method invocation to Airbrake.
 *
 * @param {string} method - The console method being called (e.g., "warn" or "error").
 * @param {...any} args - The arguments passed to the console method.
 * @returns {void}
 */
const reportToAirbrake = (method, ...args) => {
  const error =
    args.find((arg) => arg instanceof Error) ??
    new Error(formatWithOptions(INSPECT_OPTS, ...args))

  const request = args.find(
    (arg) => arg && typeof arg === 'object' && 'headers' in arg
  )

  // notify returns a promise, but we do not await it
  airbrake.notify({
    error,
    params: {
      consoleInvocationDetails: {
        method,
        arguments: args.map((arg) => inspect(arg, INSPECT_OPTS))
      }
    },
    environment: {
      ...(process.env.name && { name: process.env.name })
    },
    ...(request?.state && { session: request.state }),
    context: {
      ...(request?.method && {
        action: `${request.method.toUpperCase()} ${request.path}`
      }),
      ...(request?.headers?.['user-agent'] && {
        userAgent: request.headers['user-agent']
      })
    }
  })
}

/**
 * Initializes the Airbrake client and intercepts `console.warn` and `console.error`
 * to send notifications to Airbrake/Errbit.
 *
 * If the required environment variables are not set, Airbrake will not be initialized.
 *
 * @returns {boolean} `true` if the Airbrake client was initialized, `false` otherwise.
 */
const initialise = () => {
  if (
    airbrake ||
    !process.env.AIRBRAKE_PROJECT_KEY ||
    !process.env.AIRBRAKE_HOST
  ) {
    return !!airbrake
  }

  airbrake = new Notifier({
    projectId: 4,
    projectKey: process.env.AIRBRAKE_PROJECT_KEY,
    host: process.env.AIRBRAKE_HOST,
    environment: process.env.NODE_ENV,
    errorNotifications: true,
    performanceStats: false,
    remoteConfig: false
  })

  const originalError = console.error.bind(console)
  const originalWarn = console.warn.bind(console)

  console.error = (...args) => {
    reportToAirbrake('error', ...args)
    originalError(...args)
  }

  console.warn = (...args) => {
    reportToAirbrake('warn', ...args)
    originalWarn(...args)
  }

  // Ensure uncaught errors are logged
  process.on('uncaughtExceptionMonitor', originalError)

  // Override Airbrake's uncaughtException/unhandledRejection handlers to flush before exit
  const flushAndExit = async () => {
    await airbrake.flush()
    process.exit(1)
  }
  process.on('uncaughtException', flushAndExit)
  process.on('unhandledRejection', flushAndExit)

  return true
}

/**
 * Wraps a debug logging function so that log messages are also reported to Airbrake.
 *
 * @param {Function} logFunction - The debug logging function to wrap.
 * @returns {Function} A new logging function that reports to Airbrake before logging.
 */
const attachAirbrakeToDebugLogger = (logFunction) => {
  if (!airbrake) {
    return logFunction
  }

  return (...args) => {
    reportToAirbrake(logFunction.namespace, ...args)
    logFunction(...args)
  }
}

/**
 * Flushes the Airbrake buffer, ensuring that any pending notifications are sent
 * before returning.
 *
 * @returns {Promise<void>}
 */
const flush = async () => {
  if (initialise()) {
    await airbrake.flush()
    airbrake.close()
  }
}

export default {
  initialise,
  attachAirbrakeToDebugLogger,
  flush,
  reset
}
