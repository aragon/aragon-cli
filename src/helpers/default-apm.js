const DEFAULT_APM_REGISTRY = 'aragonpm.eth'

module.exports = name => 
	name.split('.').length > 1 ? name : `${name}.${DEFAULT_APM_REGISTRY}`