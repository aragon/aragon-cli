const reporter = require('./reporter')
const fs = require('fs')
const semver = require('semver')
const pkg = require('./pkg')
const lifecycle = require('./lifecycle')
const ipfsAPI = require('ipfs-api')
const path = require('path')
const Web3Eth = require('web3-eth')
const decamelize = require('decamelize')
const ens = require('./utils/ens-resolve')
const consts = require('./utils/constants')
const namehash = require('eth-ens-namehash')
const inspector = require('solidity-inspector')
const config = require('./config')()
const pkgDir = require('pkg-dir')

const prettyKey = (key) => {
  let str = decamelize(key, ' ')

  return str.charAt(0).toUpperCase() + str.slice(1)
}

const handlers = {
  init ([name], flags) {
    if (!name) {
      reporter.fatal('No name specified')
    }

    if (!flags.registry) {
      reporter.fatal('No registry specified')
    }

    pkg.write({
      appName: name + '.' + flags.registry,
      version: '1.0.0',
      roles: [],
      path: 'src/App.sol'
    }).then(({ appName }) => {
      reporter.info(`Created new module ${appName}`)
    })
  },
  versions (_, flags) {
    pkg.read()
      .then(async ({ appName }) => {
        const eth = new Web3Eth(flags.rpc)

        const ensAddress = flags.ens || ens.chainRegistry(flags.chainId)
        const repoAddress = await ens.resolve(appName, eth, ensAddress)
        if (repoAddress === consts.NULL_ADDRESS) {
          return []
        }

        const repo = new eth.Contract(
          require('../abi/apm/Repo.json'),
          repoAddress
        )

        return repo.getPastEvents('NewVersion', {
          fromBlock: 0
        }).then((events) => {
          return [repo, events]
        })
      })
      .then(([repo, events]) => {
        if (events.length === 0) {
          reporter.info('This package has no versions.')
          return
        }

        return Promise.all(
          events.map((event) =>
            repo.methods.getByVersionId(event.returnValues.versionId).call()
          )
        )
      })
      .then((versions) => {
        versions.forEach((version) => {
          reporter.info(`${version.semanticVersion.join('.')}: ${version.contractAddress} / ${Buffer.from(version.contentURI.substring(2), 'hex').toString('ascii')}`)
        })
      })
  },
  version ([bumpType]) {
    if (!bumpType) {
      reporter.fatal(`No bump type provided`)
    }

    pkg.read()
      .then((metadata) => {
        metadata.version = semver.inc(metadata.version, bumpType)

        return metadata
      })
      .then(pkg.write)
      .then(({ version }) => {
        reporter.info(`New version: ${version}`)
      })
  },
  publish (_, flags) {
    lifecycle.run('prepublish')
      .then(() => {
        reporter.info('Build step run')
      }, (err) => {
        reporter.warning(err)
      })
      .then(async () => {
        reporter.info('Generating artifacts')

        const module = await pkg.read()
        const contractSourcePath = path.resolve(pkgDir.sync(), module.path)
        if (!contractSourcePath) {
          reporter.warning('No contract path specified, assuming no contract')
          return
        }

        if (!fs.existsSync(contractSourcePath)) {
          reporter.fatal(`File "${contractSourcePath}" does not exist`)
        }

        const contractArtifactsPath = path.resolve(pkgDir.sync(), config.contractArtifactsPath)
        if (!fs.existsSync(contractArtifactsPath)) {
          reporter.fatal('No contract artifacts found')
        }

        const analysis = inspector.parseFile(contractSourcePath)
          .toJSON()
        const functions = Object.keys(analysis.functions)
          .map((fn) => analysis.functions[fn])
          .filter((fn) => fn.accessModifier !== 'internal' && fn.accessModifier !== 'private')

        let artifact = module
        delete artifact.path

        artifact.functions = functions.map((fn) => {
          const authModifier = fn.modifiers.filter((m) => m.name === 'auth')[0]
          const roleNeeded = authModifier ? authModifier.params[0] : null

          let params = Object.values(fn.params)
          params.forEach(p => delete p.typeHint)

          return {
            name: fn.name,
            notice: fn.notice,
            params,
            roleNeeded
          }
        })

        artifact.appId = namehash.hash(module.appName)
        artifact.abi = []

        // TODO: Add role bytes to artifacts file (in `.roles[].bytes`)

        return new Promise((resolve, reject) => {
          fs.writeFile(
            path.resolve(pkgDir.sync(), config.modulePath, 'artifact.json'),
            JSON.stringify(artifact, null, 2),
            (err) => {
              if (err) {
                reject(err)
              } else {
                resolve()
              }
            }
          )
        })
      })
      .then(() => {
        reporter.info('Publishing to IPFS')

        // Publish `cwd` to IPFS
        // TODO: Make this configurable
        // TODO: Abstract away storage provider
        const ipfs = ipfsAPI('ipfs.infura.io', '5001', { protocol: 'https' })
        return new Promise((resolve, reject) => {
          ipfs.util.addFromFs(
            path.resolve(pkgDir.sync(), config.modulePath),
            {
              recursive: true,
              // TODO: Make this configurable
              ignore: ['node_modules/**', '.git/**']
            }, (err, result) => {
              if (err) {
                throw err
              }

              // Find the hash of the directory (i.e. all files)
              const hash = result.filter((file) => file.path === path.basename(
                path.resolve(pkgDir.sync(), config.modulePath)
              )).pop().hash

              // Next!
              reporter.info(`Published module to IPFS: ${hash}`)
              resolve(hash)
            })
        })
      })
      .then((hash) => {
        return pkg.read()
          .then((pkg) => Object.assign(pkg, { hash }))
      })
      .then(async ({ appName, version, hash }) => {
        const eth = new Web3Eth(flags.rpc)

        const ensAddress = flags.ens || ens.chainRegistry(flags.chainId)
        let repoAddress = await ens.resolve(appName, eth, ensAddress)
        if (repoAddress === consts.NULL_ADDRESS) {
          // Create new repo
          const registryName = appName.split('.').splice(-2).join('.')
          const registryAddress = await ens.resolve(registryName, eth, ensAddress)
          if (registryAddress === consts.NULL_ADDRESS) {
            reporter.error(`Registry ${registryName} does not exist.`)
            return
          }

          reporter.info('This is the first time you are publishing this module')
          const registry = new eth.Contract(
            require('../abi/apm/RepoRegistry.json'),
            registryAddress
          )

          const call = registry.methods.newRepoWithVersion(
            appName.split('.').shift(),
            version.split('.').map((part) => parseInt(part)),
            consts.NULL_ADDRESS,
            '0x' + Buffer.from(`ipfs:${hash}`).toString('hex')
          )

          const rawTx = {
            to: registryAddress,
            data: call.encodeABI(),
            gas: await call.estimateGas(),
            gasPrice: await eth.getGasPrice(),
            chainId: flags.chainId
          }

          if (!flags.key) {
            reporter.info(`Sign and broadcast this transaction to create ${appName}@${version}`)

            Object.keys(rawTx).forEach((key) => {
              console.log(`${prettyKey(key)}: ${rawTx[key]}`)
            })
          } else {
            // Broadcast transaction
            return eth.accounts.signTransaction(rawTx, flags.key)
              .then((tx) => {
                return eth.sendSignedTransaction(tx.rawTransaction)
                  .then(({ transactionHash }) => {
                    reporter.info(`Created module ${appName}@${version} in transaction ${transactionHash}`)
                  }, (err) => {
                    reporter.error(err)
                  })
              })
          }
          return
        }

        const repo = new eth.Contract(
          require('../abi/apm/Repo.json'),
          repoAddress
        )

        // TODO: Add support for updating contracts
        const call = repo.methods.newVersion(
          version.split('.').map((part) => parseInt(part)),
          consts.NULL_ADDRESS,
          '0x' + Buffer.from(`ipfs:${hash}`).toString('hex')
        )

        const rawTx = {
          to: repoAddress,
          data: call.encodeABI(),
          gas: await call.estimateGas(),
          gasPrice: await eth.getGasPrice(),
          chainId: flags.chainId
        }

        if (!flags.key) {
          reporter.info(`Sign and broadcast this transaction to publish ${appName}@${version}\n`)

          Object.keys(rawTx).forEach((key) => {
            console.log(`${prettyKey(key)}: ${rawTx[key]}`)
          })
        } else {
          // Sign transaction
          const tx = eth.accounts.signTransaction(rawTx, flags.key)

          // Broadcast transaction
          return eth.sendSignedTransaction(tx)
            .then(({ transactionHash }) => {
              reporter.info(`Published ${appName}@${version} in transaction ${transactionHash}`)
            })
        }
      })
  },
  playground () {
    // TODO: Implement playground method
    reporter.fatal('Not implemented.')
  }
}

module.exports = function handle (cli) {
  const subcommand = cli.input.shift()
  if (!subcommand) {
    cli.showHelp(1)
  }

  handlers[subcommand](cli.input, cli.flags)
}
