import 'dotenv/config'
import { apiPrefixRoutes, rootRoutes } from './routes/index.js'
import Hapi from '@hapi/hapi'
import HealthCheck from './plugins/health.js'
import Inert from '@hapi/inert'
import { StatusCodes } from 'http-status-codes'
import Swagger from './plugins/swagger.js'
import Vision from '@hapi/vision'
import { envSchema } from '../config.js'
import logger from '../utils/logger-utils.js'
import { sequelize } from '../services/database.service.js'

export default async () => {
  const envValidationResult = envSchema.validate(process.env, {
    abortEarly: false
  })

  if (envValidationResult.error) {
    logger.error('Config validation error(s):')
    envValidationResult.error.details.forEach((detail) => {
      logger.error(`- ${detail.message}`)
    })
    throw new Error('Environment variables validation failed.')
  }

  const server = Hapi.server({
    port: process.env.PORT || 5000,
    host: '0.0.0.0',
    routes: {
      validate: {
        failAction: (_request, h, err) => {
          // format all joi errors
          const errors = err.details.map((detail) => ({
            message: detail.message,
            property: detail.path[0],
            value: err._original[detail.path[0]]
          }))
          return h.response({ errors }).code(StatusCodes.BAD_REQUEST).takeover()
        }
      }
    }
  })

  try {
    await sequelize.authenticate()
    logger.info('Connection has been established successfully.')
  } catch (error) {
    logger.error('Unable to connect to the database:', error)
  }

  await server.register([Inert, Vision, HealthCheck, Swagger])

  server.route(rootRoutes)

  // prefix the routes below with /api
  server.realm.modifiers.route.prefix = '/api'

  server.route(apiPrefixRoutes)

  await server.start()
  logger.info(
    'Server started at %s. Listening on %s',
    new Date(),
    server.info.uri
  )

  process.on('unhandledRejection', (err) => {
    logger.error(err)
    process.exit(1)
  })

  return server
}
