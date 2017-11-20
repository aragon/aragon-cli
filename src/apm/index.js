const ipfs = require('./storage/ipfs')
const ens = require('../ens')

const providers = {
  ipfs
}

const readFileFromApplication = (contentURI, path) => {
  return new Promise((resolve, reject) => {
    const [contentProvider, contentLocation] = contentURI.split(':')

    if (!contentProvider || !contentLocation) {
      reject(new Error(`Invalid content URI (expected format was "<provider>:<identifier>")`))
      return
    }

    if (!providers[contentProvider]) {
      reject(new Error(`The storage provider "${contentProvider}" is not supported`))
      return
    }

    resolve(
      providers[contentProvider](contentLocation, path)
    )
  })
}

const getApplicationInfo = (contentURI) => {
  return Promise.all([
    readFileFromApplication(contentURI, 'manifest.json'),
    readFileFromApplication(contentURI, 'artifact.json')
  ])
    .then((files) => files.map(JSON.parse))
    .then(
      ([ manifest, module ]) => {
        const [provider, location] = contentURI.split(':')

        return Object.assign(
          manifest,
          module,
          { content: { provider, location } }
        )
      }
    )
}

module.exports = (web3) => ({
  getRepository (appId) {
    return ens.resolve(appId, web3)
      .then(
        (address) => new web3.eth.Contract(
          require('../../abi/apm/Repo.json'),
          address
        )
      )
  },
  getVersion (appId, version) {
    return this.getRepository(appId)
      .then((repository) =>
        repository.methods.getBySemanticVersion(version).call()
      )
      .then(({ contentURI }) =>
        getApplicationInfo(web3.utils.hexToAscii(contentURI))
      )
  },
  getVersionById (appId, versionId) {
    return this.getRepository(appId)
      .then((repository) =>
        repository.methods.getByVersionId(versionId).call()
      )
      .then(({ contentURI }) =>
        getApplicationInfo(web3.utils.hexToAscii(contentURI))
      )
  },
  getLatestVersion (appId) {
    return this.getRepository(appId)
      .then((repository) =>
        repository.methods.getLatest().call()
      )
      .then(({ contentURI }) =>
        getApplicationInfo(web3.utils.hexToAscii(contentURI))
      )
  },
  getLatestVersionForContract (appId, address) {
    return this.getRepository(appId)
      .then((repository) =>
        repository.methods.getLatestForContractAddress(address).call()
      )
      .then(({ contentURI }) =>
        getApplicationInfo(web3.utils.hexToAscii(contentURI))
      )
  },
  getAllVersions (appId) {
    return this.getRepository(appId)
      .then((repository) =>
        repository.getPastEvents('NewVersion', { fromBlock: 0 })
      )
      .then((events) => Promise.all(
          events.map((event) =>
            this.getVersionById(appId, event.returnValues.versionId).call())
      ))
  }
})
