export const getServerDetails = () => ({
  info: {
    host: 'localhost:3000'
  },
  server: {
    info: {
      protocol: 'http'
    }
  }
})

export const createActivity = (
  server,
  submissionId,
  {
    daysFishedWithMandatoryRelease = '20',
    daysFishedOther = '10',
    river = 'rivers/1'
  } = {}
) => {
  return server.inject({
    method: 'POST',
    url: '/api/activities',
    payload: {
      submission: `submissions/${submissionId}`,
      daysFishedWithMandatoryRelease,
      daysFishedOther,
      river
    }
  })
}
