const ipfsAPI = require('ipfs-api')
const streamToString = require('stream-to-string')

const ipfs = ipfsAPI()
module.exports = (hash, path) => {
  return new Promise((resolve, reject) => {
    ipfs.files.cat(`${hash}/${path}`, (err, file) => {
      if (err) {
        reject(err)
        return
      }

      resolve(streamToString(file))
    })
  })
}
