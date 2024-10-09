import { Catchment } from './catchment.entity.js'
import { Region } from './region.entity.js'
import { River } from './river.entity.js'
import { Submission } from './submission.entity.js'
import { initialiseAssociations } from '../utils/entity-utils.js'

const models = { River, Catchment, Region, Submission }

initialiseAssociations(models)

export { River, Catchment, Region, Submission }
