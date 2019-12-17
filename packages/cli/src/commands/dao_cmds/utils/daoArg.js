import { isAddress, convertDAOIdToSubdomain } from '@aragon/toolkit'

export default yargs => {
  return yargs.positional('dao', {
    description: 'Address of the Kernel or AragonID',
    type: 'string',
    coerce: dao =>
      !isAddress(dao)
        ? convertDAOIdToSubdomain(dao) // Append aragonid.eth if needed
        : dao,
  })
}
