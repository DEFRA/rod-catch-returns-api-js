import Catchments from './catchments.js'
import Licences from './licences.js'
import Region from './regions.js'
import Rivers from './rivers.js'
import Species from './species.js'

import Static from './static.js'
import Submissions from './submissions.js'

export const apiPrefixRoutes = [].concat(
  Licences,
  Region,
  Rivers,
  Catchments,
  Species,
  Submissions
)

export const rootRoutes = [].concat(Static)
