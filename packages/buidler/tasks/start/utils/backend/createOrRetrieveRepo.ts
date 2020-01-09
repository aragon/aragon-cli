import ENS from 'ethjs-ens'

const ENS_REGISTRY_ADDRESS = '0x5f6f7e8cc7346a11ca2def8f827b7a0b612c56a1';
const APM_REGISTRY_ADDRESS = '0x32296d9f8fed89658668875dc73cacf87e8888b2';

async function createOrRetrieveRepo(web3, appName, appId, root, artifacts) {
  // Retrieve the Repo address from ens, create the Repo otherwise.
  let repoAddress;
  repoAddress = await ensResolve(web3, appId).catch(() => null);
  if (!repoAddress) {
    repoAddress = await createRepo(appName, root, artifacts);
  }

  // Wrap Repo address with abi.
  const Repo = artifacts.require('Repo');
  return await Repo.at(repoAddress);
}

async function createRepo(appName, root, artifacts) {
  // Retrieve APMRegistry.
  const APMRegistry = artifacts.require('APMRegistry');
  const apmRegistry = await APMRegistry.at(APM_REGISTRY_ADDRESS);

  // Create new repo.
  // TODO: Does this create a proxy already? If so, it could be reused instead of creating one later.
  // Reason: I think I saw a NewProxy event in these logs...
  const { logs } = await apmRegistry.newRepo(appName, root);

  // Retrieve repo address from creation tx logs.
  const repoAddress = logs.find(l => l.event === 'NewRepo').args.repo;

  return repoAddress;
}

async function ensResolve(web3, appId) {
  const opts = {
    provider: web3.currentProvider,
    registryAddress: ENS_REGISTRY_ADDRESS
  };

  if (!opts.provider.sendAsync) {
    opts.provider.sendAsync = opts.provider.send
  }

  const ens = new ENS(opts);
  const address = await ens.resolveAddressForNode(appId);

  return address;
}

export default createOrRetrieveRepo;
