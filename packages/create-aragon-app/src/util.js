const execa = require('execa')

const PGK_MANAGER_BIN_NPM = 'npm'

const getNodePackageManager = () => {
  return PGK_MANAGER_BIN_NPM
}

const installDeps = (cwd, task) => {
  const bin = getNodePackageManager()
  const installTask = execa(bin, ['install'], { cwd })
  installTask.stdout.on('data', log => {
    if (!log) return
    task.output = log
  })

  return installTask.catch(err => {
    throw new Error(
      `${err.message}\n${err.stderr}\n\nFailed to install dependencies. See above output.`
    )
  })
}

/**
 * Validates an Aragon ENS subdomain name
 * @param {string} name Name
 * @returns {boolean} `true` if valid
 */
function isValidEnsName(name) {
  return /^[a-z0-9-]+$/.test(name)
}

module.exports = {
  installDeps,
  isValidEnsName,
  getNodePackageManager,
}
