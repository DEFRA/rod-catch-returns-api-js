import axios from 'axios'
import { getSystemUserByOid } from '../../../services/system-users.service.js'
import initialiseServer from '../../server.js'
import jwksClient from 'jwks-rsa'
import jwt from 'jsonwebtoken'

jest.mock('axios')
jest.mock('jsonwebtoken')
jest.mock('jwks-rsa')
jest.mock('../../../services/system-users.service.js')

describe('methods.integration', () => {
  /** @type {import('@hapi/hapi').Server} */
  let server = null

  beforeAll(async () => {
    server = await initialiseServer()
  })

  afterAll(async () => {
    await server.stop()
  })

  describe('GET /api/profile', () => {
    it('should return a list of all the urls available in the api', async () => {
      const result = await server.inject({
        method: 'GET',
        url: '/api/profile'
      })

      expect(result.statusCode).toBe(200)
      expect(JSON.parse(result.payload)).toMatchSnapshot()
    })

    it("should return a 403 if the user's account is disabled", async () => {
      axios.get.mockResolvedValue({
        data: {
          jwks_uri: 'https://example.com/jwks'
        }
      })
      jwksClient.mockReturnValue({
        getSigningKey: jest.fn().mockResolvedValue({
          publicKey: 'mock-public-key'
        })
      })
      jwt.decode.mockReturnValue({ header: { kid: 'abc' } })
      jwt.verify.mockReturnValue({ oid: 'abc12345' })
      getSystemUserByOid.mockResolvedValue({
        isDisabled: true,
        roles: [{ name: 'RCR CRM Integration User' }]
      })

      const result = await server.inject({
        method: 'GET',
        url: '/api/profile',
        headers: {
          token: 'abc123'
        }
      })

      expect(result.statusCode).toBe(403)
      expect(JSON.parse(result.payload)).toStrictEqual({
        error: 'Account disabled'
      })
    })

    it('should return a 403 if the user has an incorrect role', async () => {
      axios.get.mockResolvedValue({
        data: {
          jwks_uri: 'https://example.com/jwks'
        }
      })
      jwksClient.mockReturnValue({
        getSigningKey: jest.fn().mockResolvedValue({
          publicKey: 'mock-public-key'
        })
      })
      jwt.decode.mockReturnValue({ header: { kid: 'abc' } })
      jwt.verify.mockReturnValue({ oid: 'abc12345' })
      getSystemUserByOid.mockResolvedValue({
        isDisabled: false,
        roles: [{ name: 'Unknown Role' }]
      })

      const result = await server.inject({
        method: 'GET',
        url: '/api/profile',
        headers: {
          token: 'abc123'
        }
      })

      expect(result.statusCode).toBe(403)
      expect(JSON.parse(result.payload)).toStrictEqual({
        error: 'Incorrect role'
      })
    })

    it.each(['RCR CRM Integration User', 'System Administrator'])(
      'should return a 200 if the user has a %s role',
      async (role) => {
        axios.get.mockResolvedValue({
          data: {
            jwks_uri: 'https://example.com/jwks'
          }
        })
        jwksClient.mockReturnValue({
          getSigningKey: jest.fn().mockResolvedValue({
            publicKey: 'mock-public-key'
          })
        })
        jwt.decode.mockReturnValue({ header: { kid: 'abc' } })
        jwt.verify.mockReturnValue({ oid: 'abc12345' })
        getSystemUserByOid.mockResolvedValue({
          isDisabled: false,
          roles: [{ name: role }]
        })

        const result = await server.inject({
          method: 'GET',
          url: '/api/profile',
          headers: {
            token: 'abc123'
          }
        })

        expect(result.statusCode).toBe(200)
      }
    )
  })
})
