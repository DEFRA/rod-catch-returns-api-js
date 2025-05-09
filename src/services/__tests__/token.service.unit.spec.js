import { ROLES, tokenService } from '../token.service.js'
import {
  getMockResponseToolkit,
  getServerDetails
} from '../../test-utils/server-test-utils.js'
import axios from 'axios'
import { getSystemUserByOid } from '../system-users.service.js'
import jwksClient from 'jwks-rsa'
import jwt from 'jsonwebtoken'

jest.mock('axios')
jest.mock('jsonwebtoken')
jest.mock('jwks-rsa')
jest.mock('../system-users.service.js')

describe('token.service.unit', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    axios.get.mockResolvedValue({
      data: {
        jwks_uri: 'https://example.com/jwks'
      }
    })

    process.env.OIDC_WELL_KNOWN_URL =
      'https://example.com/.well-known/openid-configuration'
    process.env.OIDC_CLIENT_ID = 'test-client-id'
  })

  const getMockResponseToolkitTakeover = () => {
    const responseObject = {
      code: jest.fn().mockReturnThis(),
      takeover: jest.fn().mockReturnThis(),
      payload: null,
      statusCode: null
    }

    const response = jest.fn().mockImplementation((payload) => {
      responseObject.payload = payload
      return responseObject
    })

    responseObject.code.mockImplementation((statusCode) => {
      responseObject.statusCode = statusCode
      return responseObject
    })

    return {
      response,
      continue: 'continue-response'
    }
  }

  describe('tokenService', () => {
    it('should continue if no token is provided', async () => {
      const h = getMockResponseToolkit()
      const result = await tokenService(
        getServerDetails({ headers: { token: undefined } }),
        h
      )
      expect(result).toBe(h.continue)
    })

    it('should return 401 and an error message if token header is invalid', async () => {
      jwt.decode.mockReturnValue(null)
      const result = await tokenService(
        getServerDetails({ headers: { token: 'abc123' } }),
        getMockResponseToolkitTakeover()
      )

      expect(result.statusCode).toBe(401)
      expect(result.payload).toStrictEqual({ error: 'Invalid token header' })
    })

    it('should return 401 if token header has no kid', async () => {
      jwt.decode.mockReturnValue({ header: {} })

      const result = await tokenService(
        getServerDetails({ headers: { token: 'abc123' } }),
        getMockResponseToolkitTakeover()
      )

      expect(result.statusCode).toBe(401)
      expect(result.payload).toStrictEqual({ error: 'Invalid token header' })
    })

    it('should return 401 if token verification fails', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Token verification failed')
      })

      const result = await tokenService(
        getServerDetails({ headers: { token: 'abc123' } }),
        getMockResponseToolkitTakeover()
      )

      expect(result.statusCode).toBe(401)
      expect(result.payload).toStrictEqual({ error: 'Invalid token header' })
    })

    it('should return 401 if token has no OID', async () => {
      jwksClient.mockReturnValue({
        getSigningKey: jest.fn().mockResolvedValue({
          publicKey: 'mock-public-key'
        })
      })
      jwt.decode.mockReturnValue({ header: { kid: 'abc' } })
      jwt.verify.mockReturnValue({})

      const result = await tokenService(
        getServerDetails({ headers: { token: 'abc123' } }),
        getMockResponseToolkitTakeover()
      )

      expect(result.statusCode).toBe(401)
      expect(result.payload).toStrictEqual({ error: 'OID not found in token' })
    })

    it('should return 403 if user account is disabled', async () => {
      jwksClient.mockReturnValue({
        getSigningKey: jest.fn().mockResolvedValue({
          publicKey: 'mock-public-key'
        })
      })
      jwt.decode.mockReturnValue({ header: { kid: 'abc' } })
      jwt.verify.mockReturnValue({ oid: 'abc12345' })
      getSystemUserByOid.mockResolvedValue({
        isDisabled: true,
        roles: [{ name: 'System Administrator' }]
      })

      const result = await tokenService(
        getServerDetails({ headers: { token: 'abc123' } }),
        getMockResponseToolkitTakeover()
      )

      expect(result.statusCode).toBe(403)
      expect(result.payload).toStrictEqual({ error: 'Account disabled' })
    })

    it('should return 403 if user has no admin or FMT role', async () => {
      jwksClient.mockReturnValue({
        getSigningKey: jest.fn().mockResolvedValue({
          publicKey: 'mock-public-key'
        })
      })
      jwt.decode.mockReturnValue({ header: { kid: 'abc' } })
      jwt.verify.mockReturnValue({ oid: 'abc12345' })
      getSystemUserByOid.mockResolvedValue({
        isDisabled: false,
        roles: [{ name: 'Some other role' }]
      })

      const result = await tokenService(
        getServerDetails({ headers: { token: 'abc123' } }),
        getMockResponseToolkitTakeover()
      )

      expect(result.statusCode).toBe(403)
      expect(result.payload).toStrictEqual({ error: 'Incorrect role' })
    })

    it('should return 401 if there is any other error', async () => {
      jwksClient.mockReturnValue({
        getSigningKey: jest.fn().mockRejectedValue({
          publicKey: 'mock-public-key'
        })
      })
      jwt.decode.mockReturnValue({ header: { kid: 'abc' } })

      const result = await tokenService(
        getServerDetails({ headers: { token: 'abc123' } }),
        getMockResponseToolkitTakeover()
      )

      expect(result.statusCode).toBe(401)
      expect(result.payload).toStrictEqual({ error: 'Invalid token' })
    })

    it('should set admin role if user has System Administrator role', async () => {
      jwksClient.mockReturnValue({
        getSigningKey: jest.fn().mockResolvedValue({
          publicKey: 'mock-public-key'
        })
      })
      jwt.decode.mockReturnValue({ header: { kid: 'abc' } })
      jwt.verify.mockReturnValue({ oid: 'abc12345' })
      getSystemUserByOid.mockResolvedValue({
        isDisabled: false,
        roles: [{ name: 'System Administrator' }]
      })

      const h = getMockResponseToolkit()
      const request = getServerDetails({ headers: { token: 'abc123' } })
      const result = await tokenService(request, h)

      expect(request.auth).toEqual({ role: ROLES.ADMIN })
      expect(result).toBe(h.continue)
    })

    it('should set FMT role if user has RCR CRM Integration User role', async () => {
      jwksClient.mockReturnValue({
        getSigningKey: jest.fn().mockResolvedValue({
          publicKey: 'mock-public-key'
        })
      })
      jwt.decode.mockReturnValue({ header: { kid: 'abc' } })
      jwt.verify.mockReturnValue({ oid: 'abc12345' })
      getSystemUserByOid.mockResolvedValue({
        isDisabled: false,
        roles: [{ name: 'RCR CRM Integration User' }]
      })

      const h = getMockResponseToolkit()
      const request = getServerDetails({ headers: { token: 'abc123' } })
      const result = await tokenService(request, h)

      expect(request.auth).toEqual({ role: ROLES.FMT })
      expect(result).toBe(h.continue)
    })
  })
})
