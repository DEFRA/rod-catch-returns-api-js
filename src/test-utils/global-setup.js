import 'dotenv/config'

export default async () => {
  process.env.DATABASE_HOST = 'localhost'
  console.log('Database host set to localhost')
}
