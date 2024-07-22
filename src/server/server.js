import 'dotenv/config'
import Hapi from '@hapi/hapi'

import Routes from './routes/index.js'

export default async () => {
  const server = Hapi.server({
    port: process.env.PORT || 5000,
    host: 'localhost'
  })

  server.route(Routes)

  await server.start()
  console.log('Server started at %s. Listening on %s', new Date(), server.info.uri)

  process.on('unhandledRejection', (err) => {
    console.log(err)
    process.exit(1)
  })

  return server
}
