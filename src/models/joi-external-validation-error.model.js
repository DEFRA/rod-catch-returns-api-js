export class JoiExternalValidationError extends Error {
  constructor(code, context = {}) {
    super(code)
    this.code = code
    this.context = context
  }
}
