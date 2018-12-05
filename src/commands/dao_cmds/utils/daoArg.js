const isAddress = addr => /0x[a-fA-F0-9]{40}/.test(addr)
const isValidAragonID = dao => /[a-z0-9]+\.eth/.test(dao)

module.exports = yargs => {
  return yargs.positional('dao', {
    description: 'Address of the Kernel or AragonID)',
    type: 'string',
    coerce: dao =>
      !isAddress(dao) && !isValidAragonID(dao)
        ? `${dao}.aragonid.eth` // append aragonid.eth if needed
        : dao,
  })
}
