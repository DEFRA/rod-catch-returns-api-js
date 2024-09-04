import 'dotenv/config'

export default async () => {
  process.env.DATABASE_HOST = 'localhost' // the app can only use the local database
  process.env.PORT = 0 // the tests run in parrallel, setting the port to 0 tells your mahchine to choose the first randomly available port that it finds
  console.log('\nDatabase host set to localhost')
}
