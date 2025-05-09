import {
  Activity,
  Catch,
  SmallCatch,
  SmallCatchCount,
  Submission
} from '../entities/index.js'

export const deleteCatches = async (activityId) => {
  await Catch.destroy({
    where: { activity_id: activityId }
  })
}

export const deleteSmallCatches = async (activityId) => {
  const smallCatchIds = (
    await SmallCatch.findAll({
      attributes: ['id'],
      where: { activity_id: activityId }
    })
  ).map((smallCatch) => smallCatch.id)

  if (smallCatchIds.length > 0) {
    await SmallCatchCount.destroy({
      where: { small_catch_id: smallCatchIds }
    })
  }

  await SmallCatch.destroy({
    where: { activity_id: activityId }
  })
}

export const deleteActivitiesAndSmallCatches = async (submissionId) => {
  const activity = await Activity.findOne({
    where: {
      submission_id: submissionId
    }
  })

  if (activity) {
    await deleteSmallCatches(activity.id)
    await deleteCatches(activity.id)
  }

  await Activity.destroy({
    where: { submission_id: submissionId }
  })
}

export const deleteSubmissionAndRelatedData = async (contactId) => {
  const submission = await Submission.findOne({
    where: {
      contactId
    }
  })

  if (submission) {
    await deleteActivitiesAndSmallCatches(submission.id)
  }

  await Submission.destroy({
    where: {
      contactId
    }
  })
}
