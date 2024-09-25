import initialiseServer from '../server.js'
import logger from '../../utils/logger-utils.js'
import { sequelize } from '../../services/database.service'

jest.mock('../../utils/logger-utils.js')
jest.mock('../../services/database.service.js')
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

describe('Server Setup', () => {
  it('should log a message saying the server has started successfully', async () => {
    sequelize.authenticate.mockResolvedValueOnce()

    await initialiseServer()

    expect(logger.info).toHaveBeenCalledWith(
      'Server started at %s. Listening on %s',
      expect.any(Date),
      expect.any(String)
    )
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
})
