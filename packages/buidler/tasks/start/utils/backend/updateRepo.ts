async function updateRepo(repo, implementation) {
  // Calculate next valid semver.
  const semver = [
    (await repo.getVersionsCount()).toNumber() + 1, // Updates to smart contracts require major bump.
    0,
    0
  ];
  console.log(`Repo version: ${semver.join('.')}`)

  // const contentURI = 'http:localhost:8080';
  const contentURI = '0x123';

  await repo.newVersion(semver, implementation.address, contentURI);
}

export default updateRepo;
