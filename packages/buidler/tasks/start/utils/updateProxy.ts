import deployImplementation from './deployImplementation';

const BASE_NAMESPACE = '0xf1f3eb40f5bc1ad1344716ced8b8a0431d840b5783aea1fd01786bc26f35ac0f';

/**
 * Updates the app proxy's implementation in the Kernel
 */
async function updateProxy(appId, root, dao, artifacts) {
  console.log(`Updating implementation...`);

  // Deploy base implementation.
  const implementation = await deployImplementation(artifacts)
  // console.log(`  New implementation: ${implementation.address}`);

  // Set the new implementation in the Kernel.
  await dao.setApp(BASE_NAMESPACE, appId, implementation.address, {
    from: root
  });
}

export default updateProxy;
