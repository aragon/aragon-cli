async function updateRepo(repo, implementation) {
  // Calculate next valid semver.
  const semver = [
    (await repo.getVersionsCount()).toNumber() + 1,
    0,
    0
  ];
  console.log(`Updating repo to version: ${semver.join('.')}`)

  const contentURI = '0x123';

  await repo.newVersion(semver, implementation.address, contentURI);
}

export default updateRepo;
