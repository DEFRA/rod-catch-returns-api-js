import 'dotenv/config'

export default async () => {
  // the app can only use the local database
  process.env.DATABASE_HOST = 'localhost'

  // the tests run in parallel, which can cause conflicts when multiple instances of the server are started for integration tests
  // setting the port to 0 tells your machine to choose the first randomly available port that it finds
  process.env.PORT = 0
  console.log('\nDatabase host set to localhost')
}
