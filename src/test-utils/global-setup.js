import 'dotenv/config'

export default async () => {
  process.env.DATABASE_HOST = 'localhost'
  console.log(process.env.DATABASE_USERNAME)
  console.log('\nDatabase host set to localhost')
}
