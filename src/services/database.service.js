import 'dotenv/config'
import { Sequelize } from 'sequelize'

const sequelize = new Sequelize(
  'rcr_api',
  process.env.DATABASE_USERNAME,
  process.env.DATABASE_PASSWORD,
  {
    dialect: 'postgres',
    host: process.env.DATABASE_HOST
  }
)

export { sequelize }
