const sha3 = require('js-sha3')
const keccak256 = x => '0x'+sha3.keccak_256(x)

const getAppNPMPackage = appName => `@aragon/apps-${appName}`

const knownApps = ['voting', 'token-manager', 'vault', 'finance']

const getAppRoles = app => {
	const arapp = require(`${getAppNPMPackage(app)}/arapp`)
	return arapp.roles.map(({ name, id }) => ({ name, id }))
}

const flatten = list => list.reduce(
    (a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []
)

const aOSRoles = [
	{ id: 'CREATE_PERMISSIONS_ROLE', name: 'Create new permissions'},
	{ id: 'APP_MANAGER_ROLE', name: 'Manage DAO apps'}
]

// TODO: add support for user apps
const rolesForApps = () => {
	const allRoles = flatten(knownApps.map(app => getAppRoles(app))).concat(aOSRoles)
	const knownRoles = allRoles.reduce(
		(acc, role) => Object.assign(acc, { [keccak256(role.id)]: role })
	, {}) 

	return knownRoles
}

module.exports = { rolesForApps }