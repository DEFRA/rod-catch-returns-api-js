import { envSchema } from '../config.js' // Replace with the actual file path

describe('config', () => {
  describe('envSchema validation', () => {
    let validEnv

    beforeEach(() => {
      validEnv = {
        NODE_ENV: 'development',
        PORT: 3000,
        DATABASE_HOST: 'localhost',
        DATABASE_NAME: 'mydb',
        DATABASE_USERNAME: 'user',
        DATABASE_PASSWORD: 'password',
        DATABASE_PORT: 5432,
        OAUTH_CLIENT_ID: 'client_id',
        OAUTH_CLIENT_SECRET: 'client_secret',
        OAUTH_AUTHORITY_HOST_URL: 'https://auth.url',
        OAUTH_TENANT: 'tenant_id',
        OAUTH_SCOPE: 'scope',
        DYNAMICS_API_PATH: '/api/path',
        DYNAMICS_API_VERSION: 'v9.0',
        DYNAMICS_API_TIMEOUT: 5000,
        DYNAMICS_CACHE_TTL: 3600
      }
    })

    it('should validate a valid environment object', () => {
      const { error } = envSchema.validate(validEnv)
      expect(error).toBeUndefined()
    })

    it('should fail validation if NODE_ENV is not a string', () => {
      validEnv.NODE_ENV = 2
      const { error } = envSchema.validate(validEnv)
      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('"NODE_ENV" must be a string')
    })

    it('should allow unknown fields in the schema', () => {
      validEnv.EXTRA_FIELD = 'extra_value'
      const { error } = envSchema.validate(validEnv)
      expect(error).toBeUndefined()
    })

    it('should fail validation if a number field is not a number', () => {
      validEnv.PORT = 'not_a_number'
      const { error } = envSchema.validate(validEnv)
      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('"PORT" must be a number')
    })

    it.each([
      'DATABASE_HOST',
      'DATABASE_NAME',
      'DATABASE_USERNAME',
      'OAUTH_CLIENT_ID',
      'OAUTH_CLIENT_SECRET',
      'OAUTH_AUTHORITY_HOST_URL',
      'OAUTH_TENANT',
      'OAUTH_SCOPE',
      'DYNAMICS_API_PATH',
      'DYNAMICS_API_VERSION'
    ])('should fail validation if %s is missing', (requiredField) => {
      delete validEnv[requiredField]
      const { error } = envSchema.validate(validEnv)
      expect(error).toBeDefined()
      expect(error.details[0].message).toContain(
        `"${requiredField}" is required`
      )
    })
  })
})
