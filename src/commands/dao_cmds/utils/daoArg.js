const web3Utils = require('web3-utils')

const isValidAragonID = dao => /[a-z0-9]+\.eth/.test(dao)

module.exports = (yargs) => {
  return yargs
    .positional('dao', {
      description: 'Address of the Kernel or AragonID)',
      type: 'string',
      coerce: dao => (
        !web3Utils.isAddress(dao) && !isValidAragonID(dao)
          ? `${dao}.aragonid.eth` // append aragonid.eth if needed
          : dao
      )
    })
}
