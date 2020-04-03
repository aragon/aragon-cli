const commandExistsSync = require('command-exists').sync
const execa = require('execa')
const fs = require('fs-extra')
const path = require('path')

const PGK_MANAGER_BIN_NPM = 'npm'
const PGK_MANAGER_BIN_YARN = 'yarn'

const getNodePackageManager = useYarn =>
  useYarn ? PGK_MANAGER_BIN_YARN : PGK_MANAGER_BIN_NPM

const installDeps = (oldTemplate, cwd, task) => {
  const useYarn = commandExistsSync('yarn') && !oldTemplate

  // If we don't use yarn we delete yarn.lock
  if (!useYarn) fs.removeSync(path.join(cwd, 'yarn.lock'))

  const bin = getNodePackageManager(useYarn)
  const installTask = execa(bin, ['install'], { cwd })

  installTask.stdout.on('data', bytes => {
    const str = Buffer.from(bytes, 'utf-8').toString()
    task.output = str
  })

  return installTask.catch(err => {
    throw new Error(
      `${err.message}\n${err.stderr}\n\nFailed to install dependencies. See above output.`
    )
  })
}

module.exports = {
  installDeps,
  getNodePackageManager,
}
