const fetchMock = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ jwks_uri: 'https://example.com/jwks' })
  })
)

export default fetchMock
