import aragonPM from '@aragon/apm'
//
import { configEnvironment } from '../helpers/configEnvironment'

/**
 *
 * @param  {string} environment Envrionment
 * @returns {Object} aragonPM object
 */
export default async environment => {
  const { web3, apmOptions } = configEnvironment(environment)

  return aragonPM(web3, apmOptions)
}
