import test from 'ava'
//
import {
  flattenAclPermissions,
  formatAclPermissions,
} from '../../src/acl/viewFormatter'

test('viewFormatter > flattenAclPermissions', t => {
  t.plan(1)

  const toAppAddress1 = '0xbc4d08eb94caf68faf73be40780b68b1de369d15'
  const toAppAddress2 = '0xb123451234512345123451234512345123451234'
  const roleHash =
    '0x0b719b33c83b8e5d300c521cb8b54ae9bd933996a14bef8c2f4e0285d2d2400a'
  const allowedEntities = ['0xb4124cEB3451635DAcedd11767f004d8a28c6eE7']
  const manager = '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7'

  const permissions = {
    [toAppAddress1]: {
      [roleHash]: {
        allowedEntities,
        manager,
      },
    },
    [toAppAddress2]: {
      [roleHash]: {
        allowedEntities,
        manager,
      },
    },
  }
  const flattenedAclPermissions = flattenAclPermissions(permissions)

  t.deepEqual(flattenedAclPermissions, [
    {
      to: toAppAddress1,
      role: roleHash,
      allowedEntities,
      manager,
    },
    {
      to: toAppAddress2,
      role: roleHash,
      allowedEntities,
      manager,
    },
  ])
})

test('viewFormatter > formatAclPermissions', t => {
  t.plan(1)

  // Mock addresses, appIds and names

  const toAppAddress = '0x' + 'a'.repeat(40)
  const toAppId = '0x' + 'a'.repeat(64)
  const toAppName = 'a.aragonpm.eth'

  const managerAppAddress = '0x' + 'b'.repeat(40)
  const managerAppId = '0x' + 'b'.repeat(64)
  const managerAppName = 'b.aragonpm.eth'

  const allowedApp1Address = '0x' + 'c1'.repeat(20)
  const allowedApp1Id = '0x' + 'c1'.repeat(32)
  const allowedApp1Name = 'c1.aragonpm.eth'

  const allowedApp2Address = '0x' + 'c2'.repeat(20)
  const allowedApp2Id = '0x' + 'c2'.repeat(32)
  const allowedApp2Name = 'c2.aragonpm.eth'

  const role1Hash = '0x' + '1'.repeat(64)
  const role1Name = 'Role 1'
  const role1Id = 'FIRST_ROLE'

  const role2Hash = '0x' + '2'.repeat(64)
  const role2Name = 'Role 2'
  const role2Id = 'SECOND_ROLE'

  // Construct permissions object to be flattened

  const permissions = {
    [toAppAddress]: {
      [role1Hash]: {
        allowedEntities: [allowedApp1Address, allowedApp2Address],
        manager: managerAppAddress,
      },
      [role2Hash]: {
        allowedEntities: [allowedApp1Address, allowedApp2Address],
        manager: managerAppAddress,
      },
    },
  }

  // Construct mappings to human names

  const apps = [
    { proxyAddress: toAppAddress, appId: toAppId },
    { proxyAddress: managerAppAddress, appId: managerAppId },
    { proxyAddress: allowedApp1Address, appId: allowedApp1Id },
    { proxyAddress: allowedApp2Address, appId: allowedApp2Id },
  ]
  const knownApps = {
    [toAppId]: toAppName,
    [managerAppId]: managerAppName,
    [allowedApp1Id]: allowedApp1Name,
    [allowedApp2Id]: allowedApp2Name,
  }
  const knownRoles = {
    [role1Hash]: { name: role1Name, id: role1Id },
    [role2Hash]: { name: role2Name, id: role2Id },
  }

  const formattedAclPermissions = formatAclPermissions(
    permissions,
    apps,
    knownApps,
    knownRoles
  )

  // Make sure that human names are assigned correctly for both roles

  t.deepEqual(formattedAclPermissions, [
    {
      to: { address: toAppAddress, name: toAppName },
      manager: { address: managerAppAddress, name: managerAppName },
      allowedEntities: [
        { address: allowedApp1Address, name: allowedApp1Name },
        { address: allowedApp2Address, name: allowedApp2Name },
      ],
      role: { hash: role1Hash, id: role1Id },
    },
    {
      to: { address: toAppAddress, name: toAppName },
      manager: { address: managerAppAddress, name: managerAppName },
      allowedEntities: [
        { address: allowedApp1Address, name: allowedApp1Name },
        { address: allowedApp2Address, name: allowedApp2Name },
      ],
      role: { hash: role2Hash, id: role2Id },
    },
  ])
})
