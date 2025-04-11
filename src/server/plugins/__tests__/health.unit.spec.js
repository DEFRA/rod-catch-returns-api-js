import HealthCheck from '../health'
import { dynamicsClient } from '@defra-fish/dynamics-lib'
import { sequelize } from '../../../services/database.service.js'

jest.mock('hapi-and-healthy')
jest.mock('@defra-fish/dynamics-lib')
jest.mock('../../../services/database.service.js')

describe('health.unit', () => {
  const getMockServer = ({ isReady = true } = {}) => ({
    app: {
      cache: {
        isReady: jest.fn().mockResolvedValue(isReady)
      }
    }
  })

  it('should check dynamics health status', async () => {
    dynamicsClient.executeUnboundFunction.mockResolvedValue({ version: '1.0' })
    const dynamicsHealthCheck = HealthCheck().options.test.node[0]

    const response = await dynamicsHealthCheck()

    expect(response).toStrictEqual({
      connection: 'dynamics',
      status: 'ok',
      version: '1.0'
    })
  })

  it('should check postgresql health status', async () => {
    sequelize.authenticate.mockResolvedValue()
    const postgresqlHealthCheck = HealthCheck().options.test.node[1]

    const response = await postgresqlHealthCheck()

    expect(response).toStrictEqual({
      connection: 'postgresql',
      status: 'ok'
    })
  })

  it('should check redis status', async () => {
    const server = getMockServer({ isReady: true })
    const redisHealthCheck = HealthCheck(server).options.test.node[2]

    const response = await redisHealthCheck()

    expect(response).toStrictEqual({
      connection: 'redis',
      status: 'ok'
    })
  })

  it('should throw an error if redis is not ready', async () => {
    const server = getMockServer({ isReady: false })
    const redisHealthCheck = HealthCheck(server).options.test.node[2]

    await expect(redisHealthCheck()).rejects.toThrow(
      'Redis connection is not ready'
    )
  })
})
