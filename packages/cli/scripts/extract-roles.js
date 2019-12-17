#!/usr/bin/env node
const { writeJson } = require('fs-extra')
const path = require('path')

const getAppNPMPackage = appName => `@aragon/apps-${appName}`

const knownApps = [
  'voting',
  'token-manager',
  'vault',
  'finance',
  'agent',
  'payroll',
  'survey',
]

const getAppRoles = app => {
  // TODO: Get arapp from IPFS && support Open Enterprice
  const arapp = require(`${getAppNPMPackage(app)}/arapp`)
  const roles = arapp.roles || []
  return roles.map(({ name, id }) => ({ name, id }))
}

const flatten = list =>
  list.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), [])

const kernelRoles = [{ id: 'APP_MANAGER_ROLE', name: 'Manage DAO apps' }]

const aclRoles = [
  { id: 'CREATE_PERMISSIONS_ROLE', name: 'Create new permissions' },
]

const evmRegRoles = [
  { id: 'REGISTRY_ADD_EXECUTOR_ROLE', name: 'Add executors' },
  { id: 'REGISTRY_MANAGER_ROLE', name: 'Enable and disable executors' },
]

// TODO: Add support for user apps
const rolesForDefaultApps = () => {
  const allRoles = flatten(knownApps.map(app => getAppRoles(app)))
    .concat(kernelRoles)
    .concat(aclRoles)
    .concat(evmRegRoles)

  return allRoles
}

writeJson(path.resolve('.', 'src/knownRoles.json'), rolesForDefaultApps(), {
  spaces: '\t',
})
