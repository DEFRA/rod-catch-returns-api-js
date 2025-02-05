import { authorize, signIn } from '../../services/oidc-service.js'

export default [
  {
    path: '/oidc/authorize',
    method: 'GET',
    handler: authorize,
    options: { auth: false }
  },
  {
    path: '/oidc/callback',
    method: 'POST',
    handler: signIn,
    options: { auth: false }
  }
]
