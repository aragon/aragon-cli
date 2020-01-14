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

  const contentURI: string = `0x${Buffer.from('http://localhost:8001').toString('hex')}`;

  await repo.newVersion(semver, implementation.address, contentURI);
}

export default updateRepo;
