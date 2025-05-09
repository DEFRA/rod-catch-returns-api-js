import { StatusCodes } from 'http-status-codes'
import axios from 'axios'
import { getSystemUserByOid } from './system-users.service.js'
import jwksClient from 'jwks-rsa'
import jwt from 'jsonwebtoken'

export const ROLES = Object.freeze({
  ADMIN: 'RcrAdminUser',
  FMT: 'RcrFMTUser'
})

export const getOpenIdConfigDocument = () => {
  return axios.get(process.env.OIDC_WELL_KNOWN_URL)
}

export const tokenService = async (request, h) => {
  const token = request.headers.token
  if (!token) {
    return h.continue // Proceed if no sessionId is provided
  }

  try {
    // get jwks uri
    const openIdConfigDocument = await getOpenIdConfigDocument()
    const client = jwksClient({ jwksUri: openIdConfigDocument?.data?.jwks_uri })

    // Decode token header to get `kid`
    const decodedHeader = jwt.decode(token, { complete: true })
    if (!decodedHeader || !decodedHeader.header.kid) {
      return h
        .response({ error: 'Invalid token header' })
        .code(StatusCodes.UNAUTHORIZED)
    }

    // Get signing key for `kid`
    const key = await client.getSigningKey(decodedHeader.header.kid)
    const signingKey = key.publicKey || key.rsaPublicKey

    // Verify token
    const decoded = jwt.verify(token, signingKey, {
      algorithms: ['RS256'],
      audience: process.env.OIDC_CLIENT_ID
    })

    // Ensure OID exists in token
    if (!decoded.oid) {
      return h
        .response({ error: 'OID not found in token' })
        .code(401)
        .takeover()
    }

    const userDetails = await getSystemUserByOid(decoded.oid)

    const hasFmtOrAdminRole = !!userDetails?.roles.find(
      (role) =>
        role.name === 'System Administrator' ||
        role.name === 'RCR CRM Integration User'
    )

    if (!userDetails || userDetails.isDisabled) {
      return h
        .response({ error: 'Account disabled' })
        .code(StatusCodes.FORBIDDEN)
        .takeover()
    }

    if (!hasFmtOrAdminRole) {
      return h
        .response({ error: 'Incorrect role' })
        .code(StatusCodes.FORBIDDEN)
        .takeover()
    }

    let role = null
    if (userDetails.roles.some((r) => r.name === 'System Administrator')) {
      role = ROLES.ADMIN
    } else if (
      userDetails.roles.some((r) => r.name === 'RCR CRM Integration User')
    ) {
      role = ROLES.FMT
    }

    // Attach OID to request
    request.auth = { role }
    return h.continue
  } catch (err) {
    console.error(err)
    return h
      .response({ error: 'Invalid token' })
      .code(StatusCodes.UNAUTHORIZED)
      .takeover()
  }
}
