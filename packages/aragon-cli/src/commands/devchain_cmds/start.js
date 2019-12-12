const { start } = require('@aragon/aragen').commands

// Using verbose approach for transparency, instead of `Object.assign(exports, start)`
exports.command = start.command
exports.describe = start.describe
exports.builder = start.builder
exports.task = start.task
exports.printAccounts = start.printAccounts
exports.printMnemonic = start.printMnemonic
exports.printResetNotice = start.printResetNotice
exports.handler = async args => {
  await start.handler(args)

  // Patch to prevent calling the onFinishCommand hook
  await new Promise((resolve, reject) => {})
}
