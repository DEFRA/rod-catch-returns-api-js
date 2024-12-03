import { convertKgtoOz, convertOztoKg } from '../utils/mass-utils.js'
import {
  extractActivityId,
  extractMethodId,
  extractSpeciesId
} from '../utils/entity-utils.js'
import { MEASURES } from '../utils/constants.js'
import { extractDateFromISO } from '../utils/date-utils.js'
import { getBaseUrl } from '../utils/url-utils.js'

/**
 * Converts and calculates mass values between kilograms and ounces based on the provided mass type.
 *
 * @param {Object} mass - The mass object containing the values to calculate.
 * @param {number} [mass.kg=0] - The mass in kilograms. Defaults to 0 if not provided.
 * @param {number} [mass.oz=0] - The mass in ounces. Defaults to 0 if not provided.
 * @param {string} mass.type - The mass type, either "IMPERIAL" or "METRIC".
 * @throws {Error} If the mass type is not provided or is invalid.
 * @returns {Object} The calculated mass values.
 * @property {number} massKg - The mass in kilograms, converted if necessary.
 * @property {number} massOz - The mass in ounces, converted if necessary.
 */
export const calculateMass = ({ kg = 0, oz = 0, type }) => {
  if (type === MEASURES.IMPERIAL) {
    const massOz = parseFloat(oz) || 0
    return {
      massKg: convertOztoKg(massOz),
      massOz
    }
  } else if (type === MEASURES.METRIC) {
    const massKg = parseFloat(kg) || 0
    return {
      massKg,
      massOz: convertKgtoOz(massKg)
    }
  }

  throw new Error(
    `Mass type must be either ${Object.values(MEASURES).join(' or ')}`
  )
}

/**
 * Maps a catch request object to a Catch entity.
 *
 * @param {Object} params - The parameters for mapping the catch request.
 * @param {string} params.activity - The activity associated with the catch, represented as a URI (e.g., "activities/404").
 * @param {string} params.dateCaught - The date the catch was made, in ISO 8601 format (e.g., "2024-06-24T00:00:00+01:00").
 * @param {string} params.species - The species of the catch, represented as a URI (e.g., "species/1").
 * @param {Object} params.mass - The mass of the catch.
 * @param {number} params.mass.kg - The mass in kilograms.
 * @param {number} params.mass.oz - The mass in ounces.
 * @param {string} params.mass.type - The type of mass representation, e.g., "IMPERIAL" or "METRIC".
 * @param {string} params.method - The fishing method used, represented as a URI (e.g., "methods/1").
 * @param {boolean} params.released - Indicates whether the catch was released.
 * @param {boolean} params.onlyMonthRecorded - Indicates if only the month of the catch was recorded (exact date is unknown).
 * @param {boolean} params.noDateRecorded - Indicates if no date was recorded for the catch.
 * @param {boolean} params.reportingExclude - Indicates if the catch should be excluded from reporting.
 *
 * @returns {Object} The mapped catch object for database insertion.
 * @property {string} activity_id - The extracted activity ID.
 * @property {string} dateCaught - The date the catch was made.
 * @property {string} species_id - The extracted species ID.
 * @property {number} mass - The mass of the catch in kilograms (converted if necessary).
 * @property {string} method_id - The extracted method ID.
 * @property {boolean} released - Whether the catch was released.
 * @property {boolean} onlyMonthRecorded - Whether only the month was recorded.
 * @property {boolean} noDateRecorded - Whether no date was recorded.
 * @property {boolean} reportingExclude - Whether the catch is excluded from reporting.
 */
export const mapRequestToCatch = ({
  activity,
  dateCaught,
  species,
  mass,
  method,
  released,
  onlyMonthRecorded,
  noDateRecorded,
  reportingExclude = false
}) => {
  const activityId = extractActivityId(activity)
  const methodId = extractMethodId(method)
  const speciesId = extractSpeciesId(species)

  // A date comes like this 2024-08-02T00:00:00+01:00. The +01:00 indicates the date-time is in a time zone that is 1 hour ahead of UTC
  // Without the code below, Sequelize converts this date-time to UTC internally. In UTC, 2024-08-02T00:00:00+01:00 becomes 2024-08-01T23:00:00 and is stored as 2024-08-01 in the database
  // The Java API treats the date literally. If you provide 2024-08-02T00:00:00+01:00, the local time zone is respected, and the date remains 2024-08-02.
  const extractedDateCaught = extractDateFromISO(dateCaught)

  const { massKg, massOz } = calculateMass(mass)

  return {
    activity_id: activityId,
    dateCaught: extractedDateCaught,
    species_id: speciesId,
    massType: mass.type,
    massOz,
    massKg,
    method_id: methodId,
    released,
    onlyMonthRecorded,
    noDateRecorded,
    reportingExclude,
    version: new Date()
  }
}

/**
 * Maps a Catch entity to a response object.
 *
 * @param {import('@hapi/hapi').Request} request - The Hapi request object
 * @param {import('../entities/index.js').Catch} catchEntity - The Catch entity
 * @returns {Object} - The mapped response object with HATEOAS links
 */
export function mapCatchToResponse(request, catchEntity) {
  const {
    id,
    dateCaught,
    massType,
    massOz,
    massKg,
    released,
    reportingExclude,
    noDateRecorded,
    onlyMonthRecorded,
    createdAt,
    updatedAt,
    version
  } = catchEntity

  const baseUrl = getBaseUrl(request)
  const catchUrl = `${baseUrl}/api/catches/${id}`

  return {
    id,
    dateCaught,
    mass: {
      type: massType,
      kg: parseFloat(massKg),
      oz: parseFloat(massOz)
    },
    released,
    reportingExclude,
    noDateRecorded,
    onlyMonthRecorded,
    createdAt,
    updatedAt,
    version,
    _links: {
      self: {
        href: catchUrl
      },
      catch: {
        href: catchUrl
      },
      activityEntity: {
        href: `${baseUrl}/api/activities/${catchEntity.activity_id}`
      },
      species: {
        href: `${catchUrl}/species`
      },
      method: {
        href: `${catchUrl}/method`
      },
      activity: {
        href: `${catchUrl}/activity`
      }
    }
  }
}
