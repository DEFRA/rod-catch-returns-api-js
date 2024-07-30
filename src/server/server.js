import 'dotenv/config'
import Hapi from '@hapi/hapi'

import Routes from './routes/index.js'
import { sequelize } from '../services/database.service.js'

export default async () => {
  const server = Hapi.server({
    port: process.env.PORT || 5000,
    host: 'localhost'
  })

  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }

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
