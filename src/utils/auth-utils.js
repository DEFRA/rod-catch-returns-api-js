export const ROLES = Object.freeze({
  ADMIN: 'RcrAdminUser',
  FMT: 'RcrFMTUser'
})

// Map of role names to their corresponding ROLES enum value
export const ROLE_MAP = Object.freeze({
  'System Administrator': ROLES.ADMIN,
  'RCR CRM Integration User': ROLES.FMT
})

export const isFMTOrAdmin = (role) => role === ROLES.FMT || role === ROLES.ADMIN
