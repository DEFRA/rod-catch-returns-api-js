export const ENVIRONMENTS = {
  development: 'development',
  production: 'production',
  test: 'test'
}

export const IS_DEV = process.env.NODE_ENV === ENVIRONMENTS.development
export const IS_PROD = process.env.NODE_ENV === ENVIRONMENTS.production
export const IS_TEST = process.env.NODE_ENV === ENVIRONMENTS.test
