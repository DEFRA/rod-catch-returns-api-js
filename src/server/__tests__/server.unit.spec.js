import initialiseServer from '../server.js'
import { sequelize } from '../../services/database.service'

jest.mock('../../services/database.service.js')
jest.mock('@hapi/hapi', () => {
  const Hapi = {
    server: jest.fn(() => ({
      route: jest.fn(),
      start: jest.fn(),
      info: {
        uri: 'http://localhost:5000'
      }
    }))
  }
  return Hapi
})

describe('Server Setup', () => {
  let logSpy
  let errorSpy

  beforeAll(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterAll(() => {
    logSpy.mockRestore()
    errorSpy.mockRestore()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should log successful connection message when database connection is successful', async () => {
    sequelize.authenticate.mockResolvedValue()

    await initialiseServer()

    expect(logSpy).toHaveBeenCalledWith(
      'Connection has been established successfully.'
    )
  })

  it('should log an error message when database connection fails', async () => {
    const errorMessage = 'Unable to connect to the database'

    sequelize.authenticate.mockRejectedValue(new Error(errorMessage))

    await initialiseServer()

    expect(errorSpy).toHaveBeenCalledWith(
      'Unable to connect to the database:',
      expect.any(Error)
    )
  })
})
