import 'dotenv/config'

export default async () => {
  process.env.DATABASE_HOST = 'localhost'
  console.log('\nDatabase host set to localhost')
}
