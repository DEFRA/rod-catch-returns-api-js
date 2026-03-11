import {
  contactAndPermissionForLicensee,
  executeQuery
} from '@defra-fish/dynamics-lib'
import { getContactForLicensee } from '../licences.service.js'

jest.mock('@defra-fish/dynamics-lib')

describe('getContactForLicensee', () => {
  const mockLast6 = 'ABC123'
  const mockPostcode = 'AB1 2CD'
  const getMockQuery = () => ({
    _retrieveRequest: {
      collection: 'defra_permissions',
      select: [
        'defra_permissionid',
        'defra_name',
        'defra_issuedate',
        'defra_startdate',
        'defra_enddate',
        'defra_stagingid',
        'defra_datasource',
        'defra_renewal',
        'defra_rcpagreement',
        'defra_licenceforyou'
      ],
      filter:
        "endswith(defra_name, 'ABC123') and statecode eq 0 and defra_ContactId/defra_postcode eq 'AB1 2CD'",
      orderBy: ['defra_issuedate desc', 'defra_ContactId/contactid asc'],
      expand: [
        {
          property: 'defra_ContactId',
          select: ['contactid', 'defra_postcode']
        }
      ]
    }
  })

  const getMockResult = () => [
    {
      entity: {
        id: '00000000-0000-0000-0000-000000000001',
        referenceNumber: '00000000-ABCDEFG-ABC123',
        issueDate: '2021-12-30T11:35:34.000Z',
        startDate: '2021-12-30T12:05:34.000Z',
        endDate: '2022-12-30T12:05:34.000Z',
        stagingId: '00000000-0000-0000-0000-000000000002',
        dataSource: {
          id: 100000001,
          label: 'Web Sales',
          description: 'Web Sales'
        },
        isRenewal: false,
        isRecurringPayment: null,
        isLicenceForYou: null
      },
      expanded: {
        licensee: {
          entity: {
            id: '00000000-0000-0000-0000-000000000003',
            postcode: 'AB1 2CD'
          }
        }
      }
    }
  ]

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should build the query with the correct arguments', async () => {
    contactAndPermissionForLicensee.mockReturnValueOnce(getMockQuery())
    executeQuery.mockResolvedValueOnce(getMockResult())

    await getContactForLicensee(mockLast6, mockPostcode)

    expect(contactAndPermissionForLicensee).toHaveBeenCalledWith(
      mockLast6,
      mockPostcode
    )
  })

  it('should call executeQuery with the generated query', async () => {
    const query = getMockQuery()
    contactAndPermissionForLicensee.mockReturnValueOnce(query)
    executeQuery.mockResolvedValueOnce(getMockResult())

    await getContactForLicensee(mockLast6, mockPostcode)

    expect(executeQuery).toHaveBeenCalledWith(query)
  })

  it('should return the result from executeQuery', async () => {
    const mockResult = getMockResult()
    contactAndPermissionForLicensee.mockReturnValueOnce(getMockQuery())
    executeQuery.mockResolvedValueOnce(mockResult)

    const result = await getContactForLicensee(mockLast6, mockPostcode)

    expect(result).toEqual(mockResult)
  })

  it('should propagate errors from executeQuery', async () => {
    const mockError = new Error('CRM failure')

    contactAndPermissionForLicensee.mockReturnValueOnce(getMockQuery())
    executeQuery.mockRejectedValueOnce(mockError)

    await expect(
      getContactForLicensee(mockLast6, mockPostcode)
    ).rejects.toThrow('CRM failure')
  })
})
