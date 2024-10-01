import { Catchment } from './catchment.entity.js'
import { River } from './river.entity.js'
import { initialiseAssociations } from '../utils/entity-utils.js'

const models = { River, Catchment }

initialiseAssociations(models)

export { River, Catchment }
