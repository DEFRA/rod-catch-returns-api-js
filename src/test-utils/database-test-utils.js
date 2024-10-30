import { Activity, Submission } from '../entities/index.js'

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

export const deleteSmallCatchesActivitiesAndSubmissions = async (contactId) => {
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
