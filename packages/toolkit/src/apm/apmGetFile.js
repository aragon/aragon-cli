import aragonPM from '@aragon/apm'

/**
 * Gets a file from a content URI
 *
 * @param {Object} web3 Web3 object
 * @param {string} uri Content URI
 * @param {string} file File path
 * @param {Object} apmOptions APM options
 * @returns {Promise} A promise that resolves to the content of the file
 */
export default async (web3, uri, file, apmOptions) => {
  const apm = await aragonPM(web3, apmOptions)

  return apm.getFile(uri, file)
}
