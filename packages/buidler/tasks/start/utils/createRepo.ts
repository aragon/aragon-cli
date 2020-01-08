const APM_REGISTRY_ADDRESS = '0x32296d9f8fed89658668875dc73cacf87e8888b2'

/**
 * Uses the local chain's APM registry to create a repository for the app.
 * @return aragonOS/apm/Repo TruffleContract
 */
async function createRepo(root, artifacts) {
  // Retrieve APMRegistry.
  const APMRegistry = artifacts.require('APMRegistry');
  const apmRegistry = await APMRegistry.at(APM_REGISTRY_ADDRESS);

  // Create new repo.
  // TODO: Does this create a proxy already? If so, it could be reused instead of creating one later.
  // Reason: I think I saw a NewProxy event in these logs...
  const appName = `App${new Date().getTime()}`
  const { logs } = await apmRegistry.newRepo(appName, root);

  // Retrieve repo address and wrap it with its abi.
  const Repo = artifacts.require('Repo');
  const repo = Repo.at(logs.find(l => l.event === 'NewRepo').args.repo);

  return repo
}

export default createRepo;
