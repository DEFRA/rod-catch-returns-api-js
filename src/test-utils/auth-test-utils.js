import axios from 'axios'
import { getSystemUserByOid } from '../services/system-users.service.js'
import jwksClient from 'jwks-rsa'
import jwt from 'jsonwebtoken'

jest.mock('axios')
jest.mock('jsonwebtoken')
jest.mock('jwks-rsa')
jest.mock('../services/system-users.service.js')

export const getMockAuthAndUser = (userOverrides) => {
  axios.get.mockResolvedValueOnce({
    data: {
      jwks_uri: 'https://example.com/jwks'
    }
  })

  jwksClient.mockReturnValueOnce({
    getSigningKey: jest.fn().mockResolvedValue({
      publicKey: 'mock-public-key'
    })
  })

  jwt.decode.mockReturnValueOnce({ header: { kid: 'abc' } })
  jwt.verify.mockReturnValueOnce({ oid: 'abc12345' })

  console.log(jwt)

  getSystemUserByOid.mockResolvedValueOnce({
    isDisabled: false,
    roles: [],
    ...userOverrides
  })
}
