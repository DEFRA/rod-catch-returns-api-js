import Catchments from './catchments.js'
import Licences from './licences.js'
import Region from './regions.js'
import Rivers from './rivers.js'
import Static from './static.js'

export const apiPrefixRoutes = [
  ...Licences,
  ...Region,
  ...Rivers,
  ...Catchments
]

export const rootRoutes = [...Static]
