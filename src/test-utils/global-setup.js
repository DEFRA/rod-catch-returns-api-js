import 'dotenv/config'

const ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'postgres']

export default async () => {
  const dbHost = process.env.DATABASE_HOST

  console.log(`\nChecking database host ${process.env.DATABASE_HOST}...`)
  if (!ALLOWED_HOSTS.includes(dbHost)) {
    console.log('You can only run the tests locally or in a CI environment!')
    process.exit(1)
  }

  console.log('Database host valid')
}
