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

module.exports = {
  dynamicsClient: {
    executeUnboundFunction: jest.fn()
  },
  contactForLicensee: jest.fn(),
  createActivity: jest.fn(),
  executeQuery: jest.fn(),
  permissionForFullReferenceNumber: jest.fn(),
  updateActivity: jest.fn(),
  retrieveMultipleAsMap: jest.fn().mockReturnValue({
    cached: jest.fn()
  }),
  Role: {
    definition: {
      localCollection: 'roles'
    }
  },
  SystemUser,
  SystemUserRole,
  findByExample: jest.fn()
}
