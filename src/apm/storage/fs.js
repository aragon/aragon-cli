const { promisify } = require('util')
const path = require('path')
const fs = require('fs')

module.exports = {
  /**
   * Gets the file at `path` from the content URI `hash`.
   *
   * @param {string} hash The content URI hash
   * @param {string} filePath The path to the file
   * @return {Promise} A promise that resolves to the contents of the file
   */
  getFile (hash, filePath) {
    return promisify(fs.readFile)(
      path.resolve(hash, filePath),
      { encoding: 'utf8' }
    )
  },
  /**
   * Uploads all files from `path` and returns the content URI for those files.
   *
   * @param {string} path The path that contains files to upload
   * @return {Promise} A promise that resolves to the content URI of the files
   */
  async uploadFiles (path) {
    return `fs:${path}`
  }
}
