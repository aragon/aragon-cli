import VerboseRenderer from 'listr-verbose-renderer'
import SilentRenderer from 'listr-silent-renderer'
import UpdateRenderer from 'listr-update-renderer'

export default function(silent, debug) {
  if (debug) return VerboseRenderer
  if (silent) return SilentRenderer
  return UpdateRenderer
}
