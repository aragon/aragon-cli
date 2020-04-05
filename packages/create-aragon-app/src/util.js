const commandExistsSync = require('command-exists').sync
const execa = require('execa')
const fs = require('fs-extra')
const path = require('path')

const PGK_MANAGER_BIN_NPM = 'npm'
const PGK_MANAGER_BIN_YARN = 'yarn'

const getNodePackageManager = useYarn =>
  useYarn ? PGK_MANAGER_BIN_YARN : PGK_MANAGER_BIN_NPM

const replaceNpmScript = async filePath => {
  const file = fs.readFileSync(filePath, 'utf8')
  const newFile = file.replace(/npm run/g, 'yarn')
  fs.writeFileSync(filePath, newFile)
}

const installDeps = (oldTemplate, cwd, task) => {
  const useYarn = commandExistsSync('yarn') && !oldTemplate

  // If we don't use yarn, delete yarn.lock
  if (!useYarn) {
    fs.removeSync(path.join(cwd, 'yarn.lock'))
    fs.removeSync(path.join(cwd, 'app', 'yarn.lock'))
  } else {
    replaceNpmScript(path.join(cwd, 'package.json'))
    replaceNpmScript(path.join(cwd, 'app', 'package.json'))
  }

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
