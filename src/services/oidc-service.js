import * as OpenIdClient from 'openid-client'
import { ROLES } from '../utils/constants.js'
import { StatusCodes } from 'http-status-codes'
import { getSystemUser } from './system-users.service.js'
import logger from '../utils/logger-utils.js'
import { v4 as uuidv4 } from 'uuid'

const { generators, Issuer } = OpenIdClient

let client = null
let cache = null
let redirectUri = null

export const initialise = async (server) => {
  const MsIssuer = await Issuer.discover(process.env.OIDC_ENDPOINT)
  logger.info('Discovered issuer %s %O', MsIssuer.issuer, MsIssuer.metadata)

  redirectUri = new URL(
    '/oidc/signin',
    process.env.OIDC_REDIRECT_HOST
  ).toString()

  client = new MsIssuer.Client({
    client_id: process.env.OIDC_CLIENT_ID,
    client_secret: process.env.OIDC_CLIENT_SECRET,
    redirect_uris: [redirectUri],
    response_types: ['code', 'id_token']
  })

  cache = server.cache({ segment: 'oidc', expiresIn: 12 * 60 * 60 * 1000 })
}

export const authorize = (request, h) => {
  const nonce = generators.nonce()
  const state = generators.state()

  cache.set(state, { state, nonce })

  const url = client.authorizationUrl({
    scope: 'openid profile email',
    response_type: 'code id_token',
    response_mode: 'form_post',
    domain_hint: 'defra.gov.uk',
    nonce,
    state
  })

  logger.info('OIDC Authorization URL: %s', url)

  return h.response({ authorizationUrl: url }).code(200)
}

/**
 * OIDC Authentication Handler - handles POST callbacks from the OpenID connect provider
 *
 * @param request the hapi request object
 * @param h the hapi response handler
 * @returns {Promise}
 */
export const signIn = async (request, h) => {
  const success = !!request.payload.id_token
  if (success) {
    // Retrieve the nonce from the server cache for the given state value
    const { nonce, state } = (await cache.get(request.payload.state)) ?? {}

    // Validate the jwt token
    const tokenSet = await client.callback(redirectUri, request.payload, {
      nonce,
      state
    })

    logger.info(
      'Received and validated oidc token.  Claims: %o',
      tokenSet.claims()
    )
    const { oid, exp } = tokenSet.claims()

    const userDetails = await getSystemUser(oid)
    const hasFmtOrAdminRole = !!userDetails?.roles.find(
      (role) =>
        role.name === 'System Administrator' ||
        role.name === 'RCR CRM Integration User'
    )

    if (!userDetails || userDetails.isDisabled) {
      return h.response({ error: 'Account disabled' }).code(403)
    }

    if (!hasFmtOrAdminRole) {
      return h.response({ error: 'Account disabled' }).code(403)
    }

    const expMs = exp * 1000 // expiry is in seconds, convert to ms
    logger.info('Token expires at: %s', new Date(expMs))

    let role = null
    if (userDetails.roles.some((r) => r.name === 'System Administrator')) {
      role = ROLES.ADMIN
    } else if (
      userDetails.roles.some((r) => r.name === 'RCR CRM Integration User')
    ) {
      role = ROLES.FMT
    }

    const authorization = {
      ...userDetails,
      role
    }

    const uuid = uuidv4()
    await request.server.app.cache.set(uuid, { authorization })

    logger.info('User is authenticated: ' + JSON.stringify(authorization))
    return h.response({ token: uuid, expiresAt: expMs }).code(200)
  } else {
    const { error, error_description: errorDescription } = request.payload
    console.error('OIDC redirect with error: ', error, errorDescription)
    return h
      .response(`Authentication error: ${error}: ${errorDescription}`)
      .code(StatusCodes.INTERNAL_SERVER_ERROR)
  }
}
