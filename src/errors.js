exports.MessageError = class MessageError extends Error {
  constructor (msg, code) {
    super(msg)

    this.code = code
    Error.captureStackTrace(this, MessageError)
  }
}
