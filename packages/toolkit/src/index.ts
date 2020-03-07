import {
  ProviderArgument,
  parseProviderArgument,
  ProviderOptions,
} from './setup'
import { Apm as _Apm } from './apm'

export * from './dao'
export * from './helpers'
export * from './utils'
export * from './util'

/**
 * Initialize an Aragon toolkit instance
 * @param providerArgument
 * @param options
 */
export function Toolkit(
  providerArgument: ProviderArgument,
  options?: ProviderOptions
) {
  const provider = parseProviderArgument(providerArgument, options)
  return {
    apm: _Apm(provider),
  }
}

/**
 * Initializes only APM functionality
 * @see Toolkit for arguments and options
 */
export function Apm(
  providerArgument: ProviderArgument,
  options?: ProviderOptions
) {
  const provider = parseProviderArgument(providerArgument, options)
  return _Apm(provider, options)
}
