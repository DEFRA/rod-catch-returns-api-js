import { sequelize } from '../services/database.service.js';

afterAll(async () => {
  await sequelize.close()
})