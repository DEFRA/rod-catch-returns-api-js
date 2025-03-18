import HapiAndHealthy from 'hapi-and-healthy'
import { dynamicsClient } from '@defra-fish/dynamics-lib'
import { sequelize } from '../../services/database.service.js'

export default (server) => ({
  plugin: HapiAndHealthy,
  options: {
    id: process.env.npm_package_name,
    env: process.env.NODE_ENV,
    name: process.env.npm_package_description,
    version: process.env.npm_package_version,
    custom: {
      versions: process.versions,
      dependencies: process.env.npm_package_dependencies
    },
    tags: ['api', 'health'],
    test: {
      node: [
        async () => {
          return {
            connection: 'dynamics',
            status: 'ok',
            ...(await dynamicsClient.executeUnboundFunction('RetrieveVersion'))
          }
        },
        async () => {
          return {
            connection: 'postgresql',
            status: 'ok',
            ...(await sequelize.authenticate())
          }
        },
        async () => {
          const result = await server.app.cache.isReady()
          if (!result) {
            throw new Error('Redis connection is not ready')
          }
          return {
            connection: 'redis',
            status: 'ok'
          }
        }
      ]
    }
  }
})
