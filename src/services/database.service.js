import 'dotenv/config'
import { IS_DEV } from '../config.js'
import { Sequelize } from 'sequelize'
console.log(IS_DEV)

const sequelize = new Sequelize(
  process.env.DATABASE_NAME,
  process.env.DATABASE_USERNAME,
  process.env.DATABASE_PASSWORD,
  {
    dialect: 'postgres',
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT || 5432,
    ...(IS_DEV
      ? {}
      : {
          dialectOptions: {
            ssl: {
              require: true,
              rejectUnauthorized: false
            }
          }
        })
  }
)

export { sequelize }
