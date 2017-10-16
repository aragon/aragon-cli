const fs = require('fs')
const path = require('path')
const pkgDir = require('pkg-dir')
const execSync = require('npm-run').execSync

module.exports = {
  run (hook) {
    return new Promise((resolve, reject) => {
      const pkgJsonPath = path.resolve(pkgDir.sync(), 'package.json')
      if (!fs.existsSync(pkgJsonPath)) {
        reject('There is no package.json defining lifecycle hooks')
      }

      fs.readFile(pkgJsonPath, (err, data) => {
        if (err) return reject(err)
        resolve(JSON.parse(data))
      })
    }).then((pkg) => {
      if (!pkg.scripts || !pkg.scripts[hook]) throw `Hook ${hook} is not defined`

      execSync(pkg.scripts[hook], {
        cwd: process.cwd(),
        env: process.env
      })
    })
  }
}
