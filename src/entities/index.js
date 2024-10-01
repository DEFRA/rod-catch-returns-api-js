import { Catchment } from './catchment.entity.js'
import { River } from './river.entity.js'

const models = { River, Catchment }

Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models)
  }
})

export { River, Catchment }
