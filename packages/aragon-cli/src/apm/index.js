const ipfs = require('./storage/ipfs')
const fs = require('./storage/fs')
const ens = require('../ens')
const semver = require('semver')

module.exports = (web3, opts = {
  ensRegistry: null
}) => {
  // Set up providers
  const providers = {
    ipfs: ipfs(opts.ipfs),
    fs: fs(opts.fs)
  }

  const readFileFromApplication = (contentURI, path) => {
    const [contentProvider, contentLocation] = contentURI.split(':')

    if (!contentProvider || !contentLocation) {
      throw new Error(`Invalid content URI (expected format was "<provider>:<identifier>")`)
    }

    if (!providers[contentProvider]) {
      throw new Error(`The storage provider "${contentProvider}" is not supported`)
    }

    return providers[contentProvider].getFile(contentLocation, path)
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
      .catch(() => {
        const [provider, location] = contentURI.split(':')
        return {
          content: { provider, location }
        }
      })
  }

  function returnVersion (web3) {
    return (version) =>
      getApplicationInfo(web3.utils.hexToAscii(version.contentURI))
        .then((info) =>
          Object.assign(info, {
            contractAddress: version.contractAddress
          }))
  }

  return {
    /**
     * Get the APM repository registry contract for `appId`.
     *
     * @param {string} appId
     * @return {Promise} A promise that resolves to the Web3 contract
     */
    getRepoRegistry (appId) {
      const registry = appId.split('.').slice(1).join('.')

      return ens.resolve(registry, web3, opts.ensRegistry)
        .then(
          (address) => new web3.eth.Contract(
            require('../../abi/apm/RepoRegistry.json'),
            address
          )
        )
    },
    /**
     * Get the APM repository contract for `appId`.
     *
     * @param {string} appId
     * @return {Promise} A promise that resolves to the Web3 contract
     */
    getRepository (appId) {
      return ens.resolve(appId, web3, opts.ensRegistry)
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
        .then(returnVersion(web3))
    },
    getVersionById (appId, versionId) {
      return this.getRepository(appId)
        .then((repository) =>
          repository.methods.getByVersionId(versionId).call()
        )
        .then(returnVersion(web3))
    },
    getLatestVersion (appId) {
      return this.getRepository(appId)
        .then((repository) =>
          repository.methods.getLatest().call()
        )
        .then(returnVersion(web3))
    },
    getLatestVersionForContract (appId, address) {
      return this.getRepository(appId)
        .then((repository) =>
          repository.methods.getLatestForContractAddress(address).call()
        )
        .then(returnVersion(web3))
    },
    getAllVersions (appId) {
      return this.getRepository(appId)
        .then((repository) =>
          repository.methods.getVersionsCount().call()
        )
        .then((versionCount) => Promise.all(
          Array(parseInt(versionCount)).fill().map((_, versionId) =>
            this.getVersionById(appId, versionId + 1))
        ))
    },
    /**
     * Publishes a new version (`version`) of `appId` using storage provider `provider`.
     *
     * If the destination repository does not exist, it falls back to creating a new
     * repository with an initial version.
     *
     * Returns the raw transaction to sign.
     *
     * @param {string} appId The ENS name for the application repository.
     * @param {string} version A valid semantic version for this version.
     * @param {string} provider The name of an APM storage provider.
     * @param {string} directory The directory that contains files to publish.
     * @param {string} contract The new contract address for this version.
     * @return {Promise} A promise that resolves to a raw transaction
     */
    async publishVersion (appId, version, provider, directory, contract, from) {
      if (!semver.valid(version)) {
        throw new Error(`${version} is not a valid semantic version`)
      }

      if (!providers[provider]) {
        throw new Error(`The storage provider "${provider}" is not supported`)
      }

      // Upload files to storage provider
      const contentURI = Buffer.from(
        await providers[provider].uploadFiles(directory)
      ).toString('hex')

      // Resolve application repository
      const repo = await this.getRepository(appId)
        .catch(() => null)

      // Default call creates a new repository and publishes the initial version
      const repoRegistry = await this.getRepoRegistry(appId)
        .catch(err => {
          throw err
          throw new Error(`Repository ${appId} does not exist and it's registry does not exist`)
        })

      let transactionDestination = repoRegistry.options.address

      let call = repoRegistry.methods.newRepoWithVersion(
        appId.split('.')[0],
        from,
        version.split('.').map((part) => parseInt(part)),
        contract,
        `0x${contentURI}`
      )

      // If the repository already exists, the call publishes a new version
      if (repo !== null) {
        transactionDestination = repo.options.address

        call = repo.methods.newVersion(
          version.split('.').map((part) => parseInt(part)),
          contract,
          `0x${contentURI}`
        )
      }

      const params = { gasPrice: web3.utils.toHex(web3.utils.toWei('3', 'gwei')) }
      if (from) {
        params.from = from
        params.nonce = await web3.eth.getTransactionCount(from)
      }

      params.gas = web3.utils.toHex(1500000)

      try {

        if (params.from) {
          // If there is no from we cannot estimate gas as it would fail for lack of from address
          params.gas = await call.estimateGas(params) // Implicit test that the call would actually succeed
        }

        // Return transaction to sign
        return {
          to: transactionDestination,
          data: call.encodeABI(),
          ...params
        }
      } catch (err) {
        throw new Error(`Transaction would not succeed ("${err.message}")`)
      }
    }
  }
}
