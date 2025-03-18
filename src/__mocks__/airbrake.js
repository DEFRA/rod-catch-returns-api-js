export class Notifier {
  constructor(options) {
    this.options = options
    this.notify = jest.fn()
    this.flush = jest.fn()
    this.close = jest.fn()
  }
}
