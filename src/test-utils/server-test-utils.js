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

export const createSubmission = (
  server,
  contactId,
  { season = '2023', status = 'INCOMPLETE', source = 'WEB' } = {}
) => {
  return server.inject({
    method: 'POST',
    url: '/api/submissions',
    payload: {
      contactId,
      season,
      status,
      source
    }
  })
}

export const createSmallCatch = (
  server,
  activityId,
  {
    month = 'FEBRUARY',
    released = '3',
    counts = [
      {
        method: 'methods/1',
        count: '3'
      },
      {
        method: 'methods/2',
        count: '2'
      },
      {
        method: 'methods/3',
        count: '1'
      }
    ],
    noMonthRecorded = false
  } = {}
) => {
  return server.inject({
    method: 'POST',
    url: '/api/smallCatches',
    payload: {
      activity: `activities/${activityId}`,
      month,
      released,
      counts,
      noMonthRecorded
    }
  })
}
