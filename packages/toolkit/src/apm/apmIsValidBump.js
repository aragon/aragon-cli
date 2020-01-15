import aragonPM from '@aragon/apm'

/**
 *
 * @param {*} web3 todo
 * @param {*} apmRepoName todo
 * @param {*} previousVersion todo
 * @param {*} version todo
 * @param {*} apmOptions todo
 * @returns {*} todo
 */
export default async (
  web3,
  apmRepoName,
  previousVersion,
  version,
  apmOptions
) => {
  const apm = await aragonPM(web3, apmOptions)

  return apm.isValidBump(apmRepoName, previousVersion, version)
}
