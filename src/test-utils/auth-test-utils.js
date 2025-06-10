import fetch from 'node-fetch'
import { getSystemUserByOid } from '../services/system-users.service.js'
import jwksClient from 'jwks-rsa'
import jwt from 'jsonwebtoken'

jest.mock('jsonwebtoken')
jest.mock('jwks-rsa')
jest.mock('../services/system-users.service.js')

export const getMockAuthAndUser = (userOverrides) => {
  fetch.mockResolvedValueOnce({
    json: () =>
      Promise.resolve({
        jwks_uri: 'https://example.com/jwks'
      }),
    ok: true
  })

  jwksClient.mockReturnValueOnce({
    getSigningKey: jest.fn().mockResolvedValue({
      publicKey: 'mock-public-key'
    })
  })

  jwt.decode.mockReturnValueOnce({ header: { kid: 'abc' } })
  jwt.verify.mockReturnValueOnce({ oid: 'abc12345' })

  getSystemUserByOid.mockResolvedValueOnce({
    isDisabled: false,
    roles: [],
    ...userOverrides
  })
}
