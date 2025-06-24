import eslintConfigPrettier from 'eslint-config-prettier/flat'
import neostandard from 'neostandard'

export default [
  ...neostandard({
    env: ['node', 'jest'],
    noStyle: true,
    eslintConfigPrettier
  }),
  {
    rules: {
      'sort-imports': ['error']
    }
  }
]
