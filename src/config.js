import joi from 'joi'

export const ENVIRONMENTS = {
  development: 'development',
  production: 'production',
  test: 'test'
}

export const IS_DEV = process.env.NODE_ENV === ENVIRONMENTS.development
export const IS_PROD = process.env.NODE_ENV === ENVIRONMENTS.production
export const IS_TEST = process.env.NODE_ENV === ENVIRONMENTS.test

export const envSchema = joi
  .object({
    NODE_ENV: joi
      .string()
      .valid(
        ENVIRONMENTS.development,
        ENVIRONMENTS.test,
        ENVIRONMENTS.production
      ),
    PORT: joi.number(),
    DATABASE_HOST: joi.string().required(),
    DATABASE_NAME: joi.string().required(),
    DATABASE_USERNAME: joi.string().required(),
    DATABASE_PASSWORD: joi.string(),
    DATABASE_PORT: joi.number(),
    OAUTH_CLIENT_ID: joi.string().required(),
    OAUTH_CLIENT_SECRET: joi.string().required(),
    OAUTH_AUTHORITY_HOST_URL: joi.string().required(),
    OAUTH_TENANT: joi.string().required(),
    OAUTH_SCOPE: joi.string().required(),
    DYNAMICS_API_PATH: joi.string().required(),
    DYNAMICS_API_VERSION: joi.string().required(),
    DYNAMICS_API_TIMEOUT: joi.number(),
    DYNAMICS_CACHE_TTL: joi.number()
  })
  .unknown()
