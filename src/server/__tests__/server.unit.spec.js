import Hapi from '@hapi/hapi'
import HealthCheck from '../plugins/health.js'
import Inert from '@hapi/inert'
import Swagger from '../plugins/swagger.js'
import Vision from '@hapi/vision'
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
jest.mock('../plugins/swagger.js')
jest.mock('../plugins/health.js')
jest.mock('@hapi/inert')
jest.mock('@hapi/vision')
jest.mock('@hapi/hapi', () => {
  const Hapi = {
    server: jest.fn(() => ({
      route: jest.fn(),
      start: jest.fn(),
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
      expect.objectContaining({ method: 'GET', path: '/catchments' }),
      expect.objectContaining({ method: 'GET', path: '/licence/{licence}' }),
      expect.objectContaining({ method: 'GET', path: '/methods' }),
      expect.objectContaining({ method: 'GET', path: '/methods/{methodId}' }),
      expect.objectContaining({ method: 'GET', path: '/regions' }),
      expect.objectContaining({ method: 'GET', path: '/rivers' }),
      expect.objectContaining({ method: 'POST', path: '/smallCatches' }),
      expect.objectContaining({
        method: 'GET',
        path: '/smallCatches/{smallCatchId}/activity'
      }),
      expect.objectContaining({ method: 'GET', path: '/species' }),
      expect.objectContaining({ method: 'POST', path: '/submissions' }),
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

  it('should log an error and exit on unhandledRejection', async () => {
    sequelize.authenticate.mockResolvedValueOnce()
    const mError = new Error('Unexpected error')
    jest.spyOn(process, 'on').mockImplementation((event, handler) => {
      if (event === 'unhandledRejection') {
        handler(mError)
      }
    })
    const exitSpy = jest.spyOn(process, 'exit').mockReturnValueOnce()

    await initialiseServer()

    expect(logger.error).toHaveBeenCalledWith(new Error('Unexpected error'))
    expect(exitSpy).toHaveBeenCalledWith(1)
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
