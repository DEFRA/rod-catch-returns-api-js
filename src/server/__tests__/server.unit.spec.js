import Hapi from '@hapi/hapi'
import HealthCheck from '../plugins/health.js'
import Inert from '@hapi/inert'
import Swagger from '../plugins/swagger.js'
import Vision from '@hapi/vision'
import airbrake from '../../utils/airbrake.js'
import initialiseServer from '../server.js'
import logger from '../../utils/logger-utils.js'
import { sequelize } from '../../services/database.service.js'

jest.mock('../../services/database.service.js', () => ({
  sequelize: {
    authenticate: jest.fn(),
    define: jest.fn(() => ({
      associate: jest.fn(),
      hasMany: jest.fn(),
      belongsTo: jest.fn()
    })),
    init: jest.fn(),
    sync: jest.fn(),
    close: jest.fn(),
    transaction: jest.fn(),
    query: jest.fn(),
    literal: jest.fn()
  }
}))
jest.mock('../../utils/logger-utils.js')
jest.mock('../../utils/airbrake.js', () => ({
  initialise: jest.fn(),
  attachAirbrakeToDebugLogger: jest.fn(() => jest.fn()),
  flush: jest.fn()
}))
jest.mock('../plugins/swagger.js')
jest.mock('../plugins/health.js')
jest.mock('@hapi/inert')
jest.mock('@hapi/vision')
jest.mock('@hapi/hapi', () => {
  const Hapi = {
    server: jest.fn(() => ({
      route: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      info: {
        uri: 'http://localhost:5000'
      },
      register: jest.fn(),
      realm: { modifiers: { route: {} } }
    }))
  }
  return Hapi
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('server.unit', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = {
      ...originalEnv
    }
  })

  it('should log a message saying the server has started successfully', async () => {
    sequelize.authenticate.mockResolvedValueOnce()

    await initialiseServer()

    expect(logger.info).toHaveBeenCalledWith(
      'Server started at %s. Listening on %s',
      expect.any(Date),
      expect.any(String)
    )
  })

  it('should configure root routes correctly', async () => {
    sequelize.authenticate.mockResolvedValueOnce()

    const server = await initialiseServer()

    expect(server.route).toHaveBeenCalledWith([
      expect.objectContaining({ method: 'GET', path: '/{param*}' })
    ])
  })

  it('should configure the /api routes correctly', async () => {
    sequelize.authenticate.mockResolvedValueOnce()

    const server = await initialiseServer()

    expect(server.route).toHaveBeenCalledWith([
      expect.objectContaining({
        method: 'POST',
        path: '/activities'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/activities/{activityId}/river'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/activities/{activityId}/smallCatches'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/activities/{activityId}/catches'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/activities/{activityId}'
      }),
      expect.objectContaining({
        method: 'DELETE',
        path: '/activities/{activityId}'
      }),
      expect.objectContaining({
        method: 'PATCH',
        path: '/activities/{activityId}'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/activities/{activityId}/submission'
      }),
      expect.objectContaining({ method: 'POST', path: '/catches' }),
      expect.objectContaining({
        method: 'GET',
        path: '/catches/{catchId}/activity'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/catches/{catchId}/species'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/catches/{catchId}/method'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/catches/{catchId}'
      }),
      expect.objectContaining({
        method: 'DELETE',
        path: '/catches/{catchId}'
      }),
      expect.objectContaining({
        method: 'PATCH',
        path: '/catches/{catchId}'
      }),
      expect.objectContaining({ method: 'GET', path: '/catchments' }),
      expect.objectContaining({
        method: 'POST',
        path: '/reporting/reference/grilse-probabilities/{season}/{gate}'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/reporting/reference/grilse-probabilities/{season}'
      }),
      expect.objectContaining({ method: 'GET', path: '/grilseWeightGates' }),
      expect.objectContaining({ method: 'GET', path: '/licence/{licence}' }),
      expect.objectContaining({
        method: 'GET',
        path: '/licence/full/{licence}'
      }),
      expect.objectContaining({ method: 'GET', path: '/methods' }),
      expect.objectContaining({ method: 'GET', path: '/methods/{methodId}' }),
      expect.objectContaining({ method: 'GET', path: '/regions' }),
      expect.objectContaining({ method: 'GET', path: '/rivers' }),
      expect.objectContaining({ method: 'POST', path: '/smallCatches' }),
      expect.objectContaining({
        method: 'GET',
        path: '/smallCatches/{smallCatchId}/activity'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/smallCatches/{smallCatchId}'
      }),
      expect.objectContaining({
        method: 'DELETE',
        path: '/smallCatches/{smallCatchId}'
      }),
      expect.objectContaining({
        method: 'PATCH',
        path: '/smallCatches/{smallCatchId}'
      }),
      expect.objectContaining({ method: 'GET', path: '/species' }),
      expect.objectContaining({ method: 'POST', path: '/submissions' }),
      expect.objectContaining({
        method: 'GET',
        path: '/submissions/search/findByContactId'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/submissions/search/getByContactIdAndSeason'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/submissions/{submissionId}/activities'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/submissions/{submissionId}'
      }),
      expect.objectContaining({
        method: 'PATCH',
        path: '/submissions/{submissionId}'
      })
    ])
  })

  it('should configure server with correct plugins', async () => {
    sequelize.authenticate.mockResolvedValueOnce()

    const server = await initialiseServer()

    expect(server.register).toHaveBeenCalledWith([
      Inert,
      Vision,
      HealthCheck,
      Swagger
    ])
  })

  it('should log successful connection message when database connection is successful', async () => {
    sequelize.authenticate.mockResolvedValueOnce()

    await initialiseServer()

    expect(logger.info).toHaveBeenCalledWith(
      'Connection has been established successfully.'
    )
  })

  it('should log an error message when database connection fails', async () => {
    const errorMessage = 'Unable to connect to the database'

    sequelize.authenticate.mockRejectedValueOnce(new Error(errorMessage))

    await initialiseServer()

    expect(logger.error).toHaveBeenCalledWith(
      'Unable to connect to the database:',
      expect.any(Error)
    )
  })

  it.each([
    ['SIGINT', 130],
    ['SIGTERM', 137]
  ])(
    'should stop the server and exit with code %d when receiving %s signal',
    async (signal, code) => {
      const server = await initialiseServer()
      const serverStopSpy = jest.spyOn(server, 'stop').mockResolvedValueOnce()
      const processStopSpy = jest
        .spyOn(process, 'exit')
        .mockImplementation(jest.fn())

      process.emit(signal)

      // Wait for the next event loop cycle
      await new Promise((resolve) => setImmediate(resolve))

      // Assert the server stopped and process.exit was called with the correct code
      expect(serverStopSpy).toHaveBeenCalled()
      expect(airbrake.flush).toHaveBeenCalled()
      expect(processStopSpy).toHaveBeenCalledWith(code)
    }
  )

  it('should initialise airbrake', async () => {
    await initialiseServer()

    expect(airbrake.initialise).toHaveBeenCalled()
  })

  it('should log and throw an error if a required environment variable is missing', async () => {
    delete process.env.DATABASE_HOST
    sequelize.authenticate.mockResolvedValueOnce()

    expect(initialiseServer()).rejects.toThrow(
      'Environment variables validation failed.'
    )

    expect(logger.error).toHaveBeenCalledWith('Config validation error(s):')
    expect(logger.error).toHaveBeenCalledWith('- "DATABASE_HOST" is required')
  })

  it('should use the default port if it is not set', async () => {
    delete process.env.PORT
    sequelize.authenticate.mockResolvedValueOnce()

    await initialiseServer()

    expect(Hapi.server).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 5000,
        host: '0.0.0.0'
      })
    )
  })
})
