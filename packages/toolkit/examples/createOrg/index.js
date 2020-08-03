const { newDao } = require('@aragon/toolkit')

const {
  DaoTokenName,
  DaoTokenSymbol,
  FundName,
  DaoMembers,
  DaoVotingAppSettings,
  DaoFinanceAppPeriod,
  environment,
} = require('./orgConfig.json')

async function main() {
  console.log('Creating DAO...')
  const daoAddress = await newDao('membership-template', {
    newInstanceArgs: [
      DaoTokenName + Math.random(),
      DaoTokenSymbol,
      FundName,
      DaoMembers,
      DaoVotingAppSettings,
      DaoFinanceAppPeriod,
      true, // Agent as default
    ],
    newInstanceMethod: 'newTokenAndInstance',
    environment,
  })

  console.log('Membership dao: ', daoAddress)

  process.exit()
}

main().catch(console.error)
