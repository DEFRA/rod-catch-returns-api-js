import { getMockAuthAndUser } from '../../../test-utils/auth-test-utils.js'
import initialiseServer from '../../server.js'

describe('profile.integration', () => {
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
      getMockAuthAndUser({
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
        error: 'ACCOUNT_DISABLED'
      })
    })

    it('should return a 403 if the user has an incorrect role', async () => {
      getMockAuthAndUser({
        isDisabled: false,
        roles: [{ name: 'Some Other Role' }]
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
        error: 'ACCOUNT_ROLE_REQUIRED'
      })
    })

    it.each(['RCR CRM Integration User', 'System Administrator'])(
      'should return a 200 if the user has a %s role',
      async (role) => {
        getMockAuthAndUser({
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
