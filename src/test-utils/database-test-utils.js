import {
  Activity,
  SmallCatch,
  SmallCatchCount,
  Submission
} from '../entities/index.js'

export const deleteActivitiesAndSubmissions = async (contactId) => {
  const submission = await Submission.findOne({
    where: {
      contactId
    }
  })
  if (submission) {
    await Activity.destroy({
      where: { submission_id: submission.id }
    })
  }
  await Submission.destroy({
    where: {
      contactId
    }
  })
}

// TODO make this neater
export const deleteSmallCatchesActivitiesAndSubmissions = async (contactId) => {
  const submission = await Submission.findOne({
    where: {
      contactId
    }
  })
  if (submission) {
    const activity = await Activity.findOne({
      where: {
        submission_id: submission.id
      }
    })
    if (activity) {
      const smallCatch = await SmallCatch.findOne({
        where: { activity_id: activity.id }
      })
      if (smallCatch) {
        await SmallCatchCount.destroy({
          where: { small_catch_id: smallCatch.id }
        })
      }

      await SmallCatch.destroy({
        where: { activity_id: activity.id }
      })
    }
    await Activity.destroy({
      where: { submission_id: submission.id }
    })
  }
  await Submission.destroy({
    where: {
      contactId
    }
  })
}
