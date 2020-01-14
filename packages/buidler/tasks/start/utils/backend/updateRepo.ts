import {
  RepoInstance
} from '../../../../typechain';

async function updateRepo(
  repo: RepoInstance,
  implementation: Truffle.Contract<any>
): Promise<void> {
  // Calculate next valid semver.
  const semver: [number, number, number] = [
    (await repo.getVersionsCount()).toNumber() + 1, // Updates to smart contracts require major bump.
    0,
    0
  ];
  console.log(`Repo version: ${semver.join('.')}`)

  // URI where this plugin is serving the app's front end.
  const contentURI: string = `0x${Buffer.from('http://localhost:8001').toString('hex')}`;

  // Create a new version in the app's repo, with the new implementation.
  await repo.newVersion(semver, implementation.address, contentURI);
}

export default updateRepo;
