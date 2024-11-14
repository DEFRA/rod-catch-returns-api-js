import { Activity } from './activity.entity.js'
import { Catch } from './catch.entity.js'
import { Catchment } from './catchment.entity.js'
import { Method } from './method.entity.js'
import { Region } from './region.entity.js'
import { River } from './river.entity.js'
import { SmallCatch } from './small-catch.entity.js'
import { SmallCatchCount } from './small-catch-count.entity.js'
import { Species } from './species.entity.js'
import { Submission } from './submission.entity.js'
import { initialiseAssociations } from '../utils/entity-utils.js'

const models = {
  Activity,
  Catch,
  Catchment,
  Method,
  Region,
  River,
  SmallCatch,
  SmallCatchCount,
  Species,
  Submission
}

initialiseAssociations(models)

export {
  Activity,
  Catch,
  Catchment,
  Method,
  Region,
  River,
  SmallCatch,
  SmallCatchCount,
  Species,
  Submission
}
