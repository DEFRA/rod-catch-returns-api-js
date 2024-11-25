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

export const getMockResponseToolkit = () => ({
  response: jest.fn().mockImplementation((payload) => ({
    code: (statusCode) => ({ payload, statusCode })
  }))
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

export const createCatch = (
  server,
  activityId,
  {
    dateCaught = '2023-06-24T00:00:00+01:00',
    species = 'species/1',
    mass = {
      kg: 9.61,
      oz: 339,
      type: 'IMPERIAL'
    },
    method = 'methods/1',
    released = true,
    onlyMonthRecorded = false,
    noDateRecorded = false
  } = {}
) => {
  return server.inject({
    method: 'POST',
    url: '/api/catches',
    payload: {
      activity: `activities/${activityId}`,
      dateCaught,
      species,
      mass,
      method,
      released,
      onlyMonthRecorded,
      noDateRecorded
    }
  })
}
