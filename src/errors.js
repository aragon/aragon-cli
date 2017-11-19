exports.MessageError = class MessageError extends Error {
  constructor (msg, code) {
    super(msg)
    this.code = code

    // Ugly hack to make `instanceof` work
    Object.setPrototypeOf(this, MessageError.prototype)
  }
}
