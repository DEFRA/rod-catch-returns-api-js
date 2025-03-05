import { getSystemUser } from './system-users.service.js'
import jwksClient from 'jwks-rsa'
import jwt from 'jsonwebtoken'

export const ROLES = Object.freeze({
  ADMIN: 'RcrAdminUser',
  FMT: 'RcrFMTUser'
})

export const tokenService = async (request, h) => {
  const token = request.headers.token
  if (!token) {
    return h.continue // Proceed if no sessionId is provided
  }

  try {
    // Get JWKS URI
    const jwksUri =
      'https://login.microsoftonline.com/defra.onmicrosoft.com/discovery/v2.0/keys'
    const client = jwksClient({ jwksUri })

    // Decode token header to get `kid`
    const decodedHeader = jwt.decode(token, { complete: true })
    if (!decodedHeader || !decodedHeader.header.kid) {
      return h.response({ error: 'Invalid token header' }).code(401)
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

    const userDetails = await getSystemUser(decoded.oid)

    const hasFmtOrAdminRole = !!userDetails?.roles.find(
      (role) =>
        role.name === 'System Administrator' ||
        role.name === 'RCR CRM Integration User'
    )

    if (!userDetails || userDetails.isDisabled) {
      return h.response({ error: 'Account disabled' }).code(403).takeover()
    }

    if (!hasFmtOrAdminRole) {
      return h.response({ error: 'Account disabled' }).code(403).takeover()
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
    return h.response({ error: 'Invalid token' }).code(401).takeover()
  }
}
