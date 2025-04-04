import Activity from './activities.js'
import Catches from './catches.js'
import Catchments from './catchments.js'
import GrilseProbabilities from './grilse-probabilities.js'
import GrilseWeightGate from './grilse-weight-gates.js'
import Licences from './licences.js'
import Method from './methods.js'
import Profile from './profile.js'
import Region from './regions.js'
import Rivers from './rivers.js'
import SmallCatches from './small-catches.js'
import Species from './species.js'
import Static from './static.js'
import Submissions from './submissions.js'

export const apiPrefixRoutes = [].concat(
  Activity,
  Catches,
  Catchments,
  GrilseProbabilities,
  GrilseWeightGate,
  Licences,
  Method,
  Profile,
  Region,
  Rivers,
  SmallCatches,
  Species,
  Submissions
)

export const rootRoutes = [].concat(Static)
