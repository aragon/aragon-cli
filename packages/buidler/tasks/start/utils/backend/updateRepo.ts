async function updateRepo(repo, implementation) {
  // Calculate next valid semver.
  const semver = [
    (await repo.getVersionsCount()).toNumber() + 1, // Updates to smart contracts require major bump.
    0,
    0
  ];
  console.log(`Repo version: ${semver.join('.')}`)

  const contentURI = `0x${Buffer.from('http://localhost:8181').toString('hex')}`;

  await repo.newVersion(semver, implementation.address, contentURI);
}

export default updateRepo;
