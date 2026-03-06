class SystemUser {
  constructor() {
    this.oid = null
  }
}

class SystemUserRole {
  constructor() {
    this.systemUserId = null
  }
}

const RCRActivity = jest.fn().mockImplementation(() => ({
  bindToEntity: jest.fn(),
  season: null,
  startDate: null,
  status: null
}))

RCRActivity.definition = {
  relationships: {
    licensee: 'licensee'
  }
}

module.exports = {
  dynamicsClient: {
    executeUnboundFunction: jest.fn()
  },
  contactAndPermissionForLicensee: jest.fn(),
  executeQuery: jest.fn(),
  permissionForFullReferenceNumber: jest.fn(),
  rcrActivityForContact: jest.fn(),
  retrieveMultipleAsMap: jest.fn().mockReturnValue({
    cached: jest.fn()
  }),
  persist: jest.fn(),
  Role: {
    definition: {
      localCollection: 'roles'
    }
  },
  SystemUser,
  SystemUserRole,
  findByExample: jest.fn(),
  RCRActivity,
  RCR_ACTIVITY_STATUS: {
    STARTED: 'STARTED',
    SUBMITTED: 'SUBMITTED'
  },
  Contact: {
    fromResponse: jest.fn()
  }
}
