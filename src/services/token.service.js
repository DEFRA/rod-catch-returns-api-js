import { StatusCodes } from 'http-status-codes'
import axios from 'axios'
import { getSystemUserByOid } from './system-users.service.js'
import jwksClient from 'jwks-rsa'
import jwt from 'jsonwebtoken'
import logger from '../utils/logger-utils.js'

export const ROLES = Object.freeze({
  ADMIN: 'RcrAdminUser',
  FMT: 'RcrFMTUser'
})

// Map of role names to their corresponding ROLES enum value
const ROLE_MAP = Object.freeze({
  'System Administrator': ROLES.ADMIN,
  'RCR CRM Integration User': ROLES.FMT
})

const getOpenIdConfigDocument = () => {
  return axios.get(process.env.OIDC_WELL_KNOWN_URL)
}

const createErrorResponse = (h, message, statusCode) => {
  return h.response({ error: message }).code(statusCode).takeover()
}

const getJwksClient = (jwksUri) => {
  return jwksClient({ jwksUri })
}

const isValidHeader = (decodedHeader) => {
  return !!decodedHeader?.header?.kid
}

const isUserDetailsValid = (userDetails) => {
  return userDetails && !userDetails.isDisabled
}

const verifyToken = async (token, client) => {
  // Decode and validate token header
  const decodedHeader = jwt.decode(token, { complete: true })
  if (!isValidHeader(decodedHeader)) {
    throw new Error('Invalid token header')
  }

  // Get signing key
  const key = await client.getSigningKey(decodedHeader.header.kid)
  const signingKey = key.publicKey || key.rsaPublicKey

  // Verify token
  return jwt.verify(token, signingKey, {
    algorithms: ['RS256']
  })
}

export const tokenService = async (request, h) => {
  const token = request.headers.token
  if (!token) {
    return h.continue
  }

  try {
    // Get OpenID configuration
    const openIdConfigDocument = await getOpenIdConfigDocument()
    const client = getJwksClient(openIdConfigDocument?.data?.jwks_uri)

    // Verify token
    const decoded = await verifyToken(token, client)

    // Validate OID exists in token
    if (!decoded.oid) {
      return createErrorResponse(
        h,
        'OID not found in token',
        StatusCodes.UNAUTHORIZED
      )
    }

    // Get user details and validate account status
    const userDetails = await getSystemUserByOid(decoded.oid)
    if (!isUserDetailsValid(userDetails)) {
      return createErrorResponse(h, 'Account disabled', StatusCodes.FORBIDDEN)
    }

    // Determine user role
    const userRole = userDetails.roles.find((r) => r.name in ROLE_MAP)
    if (!userRole) {
      return createErrorResponse(h, 'Incorrect role', StatusCodes.FORBIDDEN)
    }

    // Attach role to request
    request.auth = { role: ROLE_MAP[userRole.name] }
    return h.continue
  } catch (error) {
    logger.error('Invalid token', error)
    return createErrorResponse(h, 'Invalid token', StatusCodes.UNAUTHORIZED)
  }
}
