const findUp = require('find-up')
const path = require('path')

const findProjectRoot = () =>
  path.dirname(findUp.sync('manifest.json'))

module.exports = {
  findProjectRoot
}
