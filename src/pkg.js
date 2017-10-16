const fs = require('fs')
const path = require('path')
const pkgDir = require('pkg-dir')
const config = require('./config')()

module.exports = {
  getModuleJsonPath () {
    return path.resolve(pkgDir.sync(), config.modulePath, 'module.json')
  },
  isAragonModule () {
    return fs.existsSync(this.getModuleJsonPath())
  },
  write (data) {
    return new Promise((resolve, reject) => {
      fs.writeFile(this.getModuleJsonPath(), JSON.stringify(data, null, 2), (err) => {
        if (err) throw err

        resolve(data)
      })
    })
  },
  read () {
    return new Promise((resolve, reject) => {
      fs.readFile(this.getModuleJsonPath(), (err, data) => {
        if (err) return reject(err)
        resolve(JSON.parse(data))
      })
    })
  }
}
