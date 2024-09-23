import 'dotenv/config'
import Hapi from '@hapi/hapi'
import HealthCheck from './plugins/health.js'
import Inert from '@hapi/inert'
import Routes from './routes/index.js'
import Swagger from './plugins/swagger.js'
import Vision from '@hapi/vision'
import { envSchema } from '../config.js'
import { sequelize } from '../services/database.service.js'

export default async () => {
  const { error } = envSchema.validate(process.env, {
    abortEarly: false
  })

  if (error) {
    console.error('Config validation error(s):')
    error.details.forEach((detail) => {
      console.error(`- ${detail.message}`)
    })
    throw new Error('Environment variables validation failed.')
  }

  const server = Hapi.server({
    port: process.env.PORT || 5000,
    host: '0.0.0.0'
  })

  try {
    await sequelize.authenticate()
    console.log('Connection has been established successfully.')
  } catch (error) {
    console.error('Unable to connect to the database:', error)
  }

  await server.register([Inert, Vision, HealthCheck, Swagger])

  server.route(Routes)

  await server.start()
  console.log(
    'Server started at %s. Listening on %s',
    new Date(),
    server.info.uri
  )

  process.on('unhandledRejection', (err) => {
    console.log(err)
    process.exit(1)
  })

  return server
}
