import aragonPM from '@aragon/apm'
//
import { useEnvironment } from '../helpers/useEnvironment'

/**
 *
 * @param  {string} environment Envrionment
 * @returns {Object} aragonPM object
 */
export default async function getApm(environment) {
  const { web3, apmOptions } = useEnvironment(environment)

  return aragonPM(web3, apmOptions)
}
