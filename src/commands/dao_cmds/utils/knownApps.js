const namehash = require('eth-ens-namehash').hash
const sha3 = require('js-sha3')

const keccak256 = x => '0x' + sha3.keccak_256(x)

const knownAppNames = [
  'voting',
  'token-manager',
  'finance',
  'vault',
  'kernel',
  'acl',
  'evmreg',
  'apm-registry',
  'apm-repo',
  'apm-enssub'
]

const knownAPMRegistries = ['aragonpm.eth', 'open.aragonpm.eth']

const listApps = (userApps = []) => {
  const appNames = knownAppNames.reduce((acc, appName) => (
    acc.concat(knownAPMRegistries.map(apm => appName + '.' + apm))
  ), []).concat(userApps)

  let appIds = appNames.reduce((acc, app) => Object.assign(acc, { [namehash(app)]: app }), {})
  // because of a current issue in the deployed apps, we need to calculate with just the keccak too (otherwise acl and evmreg dont show up)
  return appNames.reduce((acc, app) => Object.assign(acc, { [keccak256(app)]: app }), appIds)
}

module.exports = { listApps }
