const VerboseRenderer = require('listr-verbose-renderer')
const SilentRenderer = require('listr-silent-renderer')
const UpdateRenderer = require('listr-update-renderer')

module.exports = function(silent, debug) {
  if (debug) return VerboseRenderer
  if (silent) return SilentRenderer
  return UpdateRenderer
}
