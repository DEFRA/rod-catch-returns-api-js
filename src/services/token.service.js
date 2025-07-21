import { ROLE_MAP } from '../utils/auth-utils.js'
import { StatusCodes } from 'http-status-codes'
import fetch from 'node-fetch'
import { getSystemUserByOid } from './system-users.service.js'
import jwksClient from 'jwks-rsa'
import jwt from 'jsonwebtoken'
import logger from '../utils/logger-utils.js'

const CACHE_TTL_MS_WELL_KNOWN = 3600000 // cache for 1 hour

const getOpenIdConfigDocument = async (cache) => {
  const cachedResponse = await cache.get('OIDC_WELL_KNOWN_RESULT')
  if (cachedResponse) {
    return cachedResponse
  }

  const response = await fetch(process.env.OIDC_WELL_KNOWN_URL)
  if (!response.ok) {
    throw new Error(`HTTP error status: ${response.status}`)
  }
  const data = await response.json()
  await cache.set('OIDC_WELL_KNOWN_RESULT', data, CACHE_TTL_MS_WELL_KNOWN)
  return data
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

  const cache = request.server.app.cache

  try {
    // Get OpenID configuration
    const openIdConfigDocument = await getOpenIdConfigDocument(cache)
    const client = getJwksClient(openIdConfigDocument?.jwks_uri)

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
    const userDetails = await getSystemUserByOid(decoded.oid, cache)
    if (!isUserDetailsValid(userDetails)) {
      return createErrorResponse(h, 'ACCOUNT_DISABLED', StatusCodes.FORBIDDEN)
    }

    // Determine user role
    const userRole = userDetails.roles.find((r) => r.name in ROLE_MAP)
    if (!userRole) {
      return createErrorResponse(
        h,
        'ACCOUNT_ROLE_REQUIRED',
        StatusCodes.FORBIDDEN
      )
    }

    // Attach role to request
    request.auth = { role: ROLE_MAP[userRole.name] }
    return h.continue
  } catch (error) {
    logger.error('INVALID_TOKEN', error)
    return createErrorResponse(h, 'INVALID_TOKEN', StatusCodes.UNAUTHORIZED)
  }
}
