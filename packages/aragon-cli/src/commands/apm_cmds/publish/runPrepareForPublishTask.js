const tmp = require('tmp-promise')
const path = require('path')
const { readJson, writeJson, pathExistsSync } = require('fs-extra')
const APM = require('@aragon/apm')
const TaskList = require('listr')
const { findProjectRoot } = require('../../../util')
const listrOpts = require('@aragon/cli-utils/src/helpers/listr-options')
const { MANIFEST_FILE, ARTIFACT_FILE } = require('../../../params')
const { prepareFilesForPublishing } = require('../util/prepare-files')
const askToConfirm = require('../util/askToConfirm')
const {
  sanityCheck,
  generateApplicationArtifact,
  writeApplicationArtifact,
  generateFlattenedCode,
  copyCurrentApplicationArtifacts,
  SOLIDITY_FILE,
} = require('../util/generate-artifact')

/**
 * ctx mandatory output
 * - pathToPublish {string}
 */
module.exports = function runPrepareForPublishTask({
  // Globals
  cwd,
  web3,
  module,
  apm: apmOptions,
  silent,
  debug,

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
  deployArtifacts,
}) {
  apmOptions.ensRegistryAddress = apmOptions['ens-registry']
  const apm = APM(web3, apmOptions)

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
          if (!httpServedFrom) {
            throw new Error('You need to provide --http-served-from argument')
          }

          const projectRoot = findProjectRoot()
          const manifestOrigin = path.resolve(projectRoot, MANIFEST_FILE)
          const manifestDst = path.resolve(httpServedFrom, MANIFEST_FILE)

          if (!pathExistsSync(manifestDst) && pathExistsSync(manifestOrigin)) {
            let manifest = await readJson(manifestOrigin)
            manifest.start_url = path.basename(manifest.start_url)
            manifest.script = path.basename(manifest.script)
            await writeJson(manifestDst, manifest)
          }

          // (TODO): ctx mutation
          ctx.pathToPublish = httpServedFrom
        },
      },
      {
        title: 'Generate application artifact',
        skip: () => onlyContent && !module.path,
        task: async (ctx, task) => {
          const outputPath = onlyArtifacts ? cwd : ctx.pathToPublish

          const contractPath = module.path
          const roles = module.roles

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
            await writeApplicationArtifact(artifact, outputPath)
            await generateFlattenedCode(outputPath, contractPath)
            return `Saved artifact in ${outputPath}/${ARTIFACT_FILE}`
          }

          async function invokeArtifactGeneration() {
            const {
              artifact,
              missingArtifactVersions,
            } = await generateApplicationArtifact(
              cwd,
              deployArtifacts,
              module,
              apm
            )
            if (missingArtifactVersions.length) {
              const missingVersionsList = missingArtifactVersions.join(', ')
              return askToConfirm(
                `Cannot find artifacts for versions ${missingVersionsList} in aragonPM.\nPlease make sure the package was published and your IPFS or HTTP server are running.\nContinue?`,
                async () => await performArtifcatGeneration(artifact)
              )
            } else {
              return await performArtifcatGeneration(artifact)
            }
          }

          // If an artifact file exist we check it to reuse
          if (pathExistsSync(`${outputPath}/${ARTIFACT_FILE}`)) {
            const existingArtifactPath = path.resolve(outputPath, ARTIFACT_FILE)
            const existingArtifact = await readJson(existingArtifactPath)
            const rebuild = await sanityCheck(
              cwd,
              roles,
              contractPath,
              existingArtifact
            )
            if (rebuild) {
              return askToConfirm(
                "Couldn't reuse artifact due to mismatches, regenerate now?",
                invokeArtifactGeneration
              )
            } else {
              return task.skip('Using existing artifact')
            }
          }

          // If only content we fetch artifacts from previous version
          if (onlyContent & !apm.validInitialVersions.includes(version)) {
            try {
              task.output = 'Fetching artifacts from previous version'
              await copyCurrentApplicationArtifacts(
                cwd,
                outputPath,
                apm,
                initialRepo,
                version,
                roles,
                contractPath
              )
              if (!pathExistsSync(`${outputPath}/${SOLIDITY_FILE}`)) {
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

          return await invokeArtifactGeneration()
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
            module.appName,
            version,
            http ? 'http' : provider,
            http || ctx.pathToPublish,
            contractAddress
          )
        },
      },
    ],
    listrOpts(silent, debug)
  )
}
