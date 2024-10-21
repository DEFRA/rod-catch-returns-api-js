import { River } from '../entities'

export const isRiverInternal = async (riverId) => {
  const foundRiver = await River.findOne({ where: { id: riverId } })
  if (foundRiver === null) {
    throw new Error('River does not exist')
  }

  // Normal users cannot add internal rivers, but admin users can
  if (foundRiver.toJSON().internal) {
    return true
  }

  return false
}
