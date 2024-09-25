describe('database.unit', () => {
  describe('Sequelize configuration based on NODE_ENV', () => {
    let originalEnv

    beforeEach(() => {
      jest.resetModules()
      originalEnv = process.env.NODE_ENV
    })

    afterEach(() => {
      process.env.NODE_ENV = originalEnv
      jest.resetModules()
    })

    it('should include SSL options when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production'

      const { sequelize } = require('../database.service.js')

      const config = sequelize.options
      expect(config.dialectOptions).toEqual({
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      })
    })

    it('should not include SSL options when NODE_ENV is not production', () => {
      process.env.NODE_ENV = 'development'

      const { sequelize } = require('../database.service.js')

      const config = sequelize.options
      expect(config.dialectOptions).toBeUndefined()
    })
  })
})
