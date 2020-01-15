import aragonPM from '@aragon/apm'

/**
 *
 * @param {*} web3 todo
 * @param {*} uri todo
 * @param {*} file todo
 * @param {*} apmOptions todo
 * @returns {*} todo
 */
export default async (web3, uri, file, apmOptions) => {
  const apm = await aragonPM(web3, apmOptions)

  return apm.getFile(uri, file)
}
