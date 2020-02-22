import { useEnvironment } from '../helpers/useEnvironment'
// Note: Must use require because 'ethereum-ens' is an untyped library
// without type definitions or @types/ethereum-ens
/* eslint-disable @typescript-eslint/no-var-requires */
const aragonPM = require('@aragon/apm')

/**
 *
 * @param environment Envrionment
 * @returns {Object} aragonPM object
 */
export default async function getApm(environment: string) {
  const { web3, apmOptions } = useEnvironment(environment)

  return aragonPM(web3, apmOptions)
}
