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

export const getResponseToolkit = () => ({
  response: jest.fn().mockReturnThis(),
  code: jest.fn()
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
