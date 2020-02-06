const execa = require('execa')

const PGK_MANAGER_BIN_NPM = 'npm'

const getNodePackageManager = () => {
  return PGK_MANAGER_BIN_NPM
}

const installDeps = (cwd, task) => {
  const bin = getNodePackageManager()
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

/**
 * Validates an Aragon Id
 * @param {string} aragonId Aragon Id
 * @returns {boolean} `true` if valid
 */
function isValidAragonId(aragonId) {
  return /^[a-z0-9-]+$/.test(aragonId)
}

module.exports = {
  installDeps,
  isValidAragonId,
  getNodePackageManager,
}
