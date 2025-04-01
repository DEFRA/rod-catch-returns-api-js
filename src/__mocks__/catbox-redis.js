class MockCatboxRedis {
  constructor(options) {
    this.options = options
    this.client = {
      started: false,
      set: jest.fn().mockResolvedValue(),
      get: jest.fn().mockResolvedValue(null),
      drop: jest.fn().mockResolvedValue()
    }
  }

  validateSegmentName(name) {
    if (!name || typeof name !== 'string') {
      throw new Error('Invalid segment name')
    }
    return null // Returning null means the name is valid
  }

  async start() {
    this.client.started = true
    return Promise.resolve()
  }

  async stop() {
    this.client.started = false
    return Promise.resolve()
  }

  isReady() {
    return this.client.started
  }

  async set(key, value, ttl) {
    return this.client.set(key, { item: value, stored: Date.now(), ttl })
  }

  async get(key) {
    return this.client.get(key)
  }

  async drop(key) {
    return this.client.drop(key)
  }
}

module.exports = { Engine: MockCatboxRedis }
