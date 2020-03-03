import tmp from 'tmp-promise'
import TaskList from 'listr'
import path from 'path'
import { readJsonSync, readFile } from 'fs-extra'
import {
  APM_INITIAL_VERSIONS,
  generateApplicationArtifact,
  loadArappFile,
  getApm,
  useEnvironment,
} from '@aragon/toolkit'
//
import listrOpts from '../../../helpers/listr-options'
import askToConfirm from '../../../lib/publish/askToConfirm'
import { prepareFilesForPublishing } from '../../../lib/publish/preprareFiles'
import {
  changeManifestForHttpServedFrom,
  writeApplicationArtifact,
  flattenCodeFileExists,
  generateFlattenedCode,
  artifactExists,
  checkIfNewArticatIsIdentical,
  copyCurrentApplicationArtifacts,
} from '../../../lib/apm/generateArtifact'
import abiAragonAppProxy from '@aragon/os/abi/AppProxyBase'
import abiUtils from 'web3-eth-abi'

/**
 * ctx mandatory output
 * - pathToPublish {string}
 * @return {TaskList} Tasks
 */
export default async function runPrepareForPublishTask({
  // Globals
  cwd,
  environment,

  // Arguments

  /// Files
  publishDir,
  files,
  ignore,

  /// Http
  httpServedFrom,

  /// Storage
  provider,

  /// Conditionals
  onlyArtifacts,
  onlyContent,
  http,

  // Context
  initialRepo,
  initialVersion,
  version,
  contractAddress,
  silent,
  debug,
}) {
  const { web3, apmOptions, appName } = useEnvironment(environment)

  const apm = await getApm(environment)

  const arapp = loadArappFile()

  const { path: contractPath, roles } = arapp

  return new TaskList(
    [
      {
        title: 'Prepare files for publishing',
        enabled: () => !http,
        task: async ctx => {
          // If no publishDir, create temporary directory
          const pathToPublish = publishDir || (await tmp.dir()).path

          await prepareFilesForPublishing(pathToPublish, files, ignore)

          // (TODO): ctx mutation
          ctx.pathToPublish = pathToPublish

          return `Files copied to temporary directory: ${pathToPublish}`
        },
      },
      {
        title:
          'Check for --http-served-from argument and copy manifest.json to destination',
        enabled: () => http,
        task: async ctx => {
          if (!httpServedFrom)
            throw new Error('You need to provide --http-served-from argument')

          changeManifestForHttpServedFrom(httpServedFrom)

          // (TODO): ctx mutation
          ctx.pathToPublish = httpServedFrom
        },
      },
      {
        title: 'Generate application artifact',
        skip: () => onlyContent && !contractPath,
        task: async (ctx, task) => {
          const outputPath = onlyArtifacts ? cwd : ctx.pathToPublish

          /**
           * Define `performArtifcatGeneration` and `invokeArtifactGeneration`
           * previously so they can be reused below depending on what question
           * has to be asked to the user.
           * NOTE: `listr-input` (wrapped in askToConfirm) requires to be
           * returned in order to work, so it's necessary to nest callbacks
           *
           * TODO: (Gabi) Use inquier to handle confirmation
           */

          async function performArtifcatGeneration(artifact) {
            writeApplicationArtifact(artifact, outputPath)
            await generateFlattenedCode(outputPath, contractPath)
            return `Saved artifact in ${outputPath}`
          }

          async function invokeArtifactGeneration() {
            const contractInterfacePath = path.resolve(
              cwd,
              'build/contracts',
              path.basename(contractPath, '.sol') + '.json'
            )

            const contractInterface = readJsonSync(contractInterfacePath)
            const sourceCode = await readFile(contractPath, 'utf8')

            checkSignatureCollisionsWithProxy(contractInterface.abi)

            const artifact = await generateApplicationArtifact(
              arapp,
              contractInterface.abi,
              sourceCode
            )
            performArtifcatGeneration(artifact)
          }

          // If an artifact file exist we check it to reuse
          if (artifactExists(outputPath)) {
            const currentArtifactIsIdentical = !checkIfNewArticatIsIdentical(
              cwd,
              roles,
              contractPath,
              outputPath
            )
            if (!currentArtifactIsIdentical) {
              return askToConfirm(
                "Couldn't reuse artifact due to mismatches, regenerate now?",
                invokeArtifactGeneration
              )
            } else {
              return task.skip('Using existing artifact')
            }
          }

          // If only content we fetch artifacts from previous version
          if (onlyContent & !APM_INITIAL_VERSIONS.includes(version)) {
            try {
              task.output = 'Fetching artifacts from previous version'
              await copyCurrentApplicationArtifacts(
                web3,
                cwd,
                outputPath,
                initialRepo,
                version,
                roles,
                contractPath,
                apmOptions
              )
              if (!flattenCodeFileExists(outputPath)) {
                await generateFlattenedCode(outputPath, contractPath)
              }
              return task.skip(`Using artifacts from v${initialVersion}`)
            } catch (e) {
              if (e.message === 'Artifact mismatch') {
                return askToConfirm(
                  "Couldn't reuse existing artifact due to mismatches, regenerate now?",
                  invokeArtifactGeneration
                )
              } else {
                return askToConfirm(
                  "Couldn't fetch current artifact version to copy it. Please make sure your IPFS or HTTP server are running. Otherwise, generate now?",
                  invokeArtifactGeneration
                )
              }
            }
          }

          return invokeArtifactGeneration()
        },
      },
      {
        title: `Publish intent`,
        task: async (ctx, task) => {
          ctx.contractInstance = null // clean up deploy sub-command artifacts
          const accounts = await web3.eth.getAccounts()
          const from = accounts[0]
          ctx.intent = await apm.publishVersionIntent(
            from,
            appName,
            version,
            http ? 'http' : provider,
            http || ctx.pathToPublish,
            contractAddress
          )
        },
      },
    ],
    listrOpts(silent, debug)
  ).run()
}

function checkSignatureCollisionsWithProxy(abi) {
  const appProxyAbi = abiAragonAppProxy.abi.filter(
    ({ type }) => type === 'function'
  )
  const collisions = findFunctionSignatureCollisions(abi, appProxyAbi)
  if (collisions.length > 0) {
    console.log(
      `WARNING: Collisions detected between the proxy and app contract ABI's.
                This is a potential security risk.
                Affected functions:`,
      JSON.stringify(collisions.map(entry => entry.name))
    )
  }
}

function findFunctionSignatureCollisions(abi1, abi2) {
  const getFunctionSignatures = abi => {
    const signatures = []
    for (const entity of abi) {
      if (!(entity.type === 'function')) continue
      signatures.push({
        name: entity.name,
        signature: abiUtils.encodeFunctionSignature(entity),
      })
    }
    return signatures
  }

  const signatures1 = getFunctionSignatures(abi1)
  const signatures2 = getFunctionSignatures(abi2)

  const collisions = signatures1.filter(item1 => {
    if (signatures2.some(item2 => item2.signature === item1.signature))
      return true
    return false
  })

  return collisions
}
