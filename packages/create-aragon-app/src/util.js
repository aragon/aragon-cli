const commandExistsSync = require('command-exists').sync
const execa = require('execa')

const PGK_MANAGER_BIN_NPM = 'npm'
const PGK_MANAGER_BIN_YARN = 'yarn'

const getNodePackageManager = oldTemplate => {
  if (commandExistsSync('yarn')) {
    return oldTemplate ? PGK_MANAGER_BIN_NPM : PGK_MANAGER_BIN_YARN
  }
  return PGK_MANAGER_BIN_NPM
}

const installDeps = (oldTemplate, cwd, task) => {
  const bin = getNodePackageManager(oldTemplate)
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
