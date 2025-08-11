import joi from 'joi'

export const IS_DEV = process.env.NODE_ENV === 'development'

export const envSchema = joi
  .object({
    NODE_ENV: joi.string(),
    PORT: joi.number(),
    DEBUG: joi.string(),
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
    DYNAMICS_CACHE_TTL: joi.number(),
    OIDC_WELL_KNOWN_URL: joi.string().required(),
    BASE_URL: joi.string().required(),
    AIRBRAKE_PROJECT_KEY: joi.string(),
    AIRBRAKE_HOST: joi.string()
  })
  .unknown()
