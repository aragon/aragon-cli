const fs = require('fs')
const path = require('path')
const pkgDir = require('pkg-dir')

module.exports = () => {
  const pkgJsonPath = path.resolve(pkgDir.sync(), 'package.json')

  if (!fs.existsSync(pkgJsonPath)) {
    return {}
  }

  const pkg = fs.readFileSync(pkgJsonPath)

  const resolvedConfig = (pkg.config && pkg.config.aragon)
    ? pkg.config.aragon
    : {}

  return Object.assign(
    {
      contractArtifactsPath: './build/contracts',
      modulePath: './build/app'
    },
    resolvedConfig
  )
}
