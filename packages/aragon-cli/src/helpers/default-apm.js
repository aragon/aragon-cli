const DEFAULT_APM_REGISTRY = 'aragonpm.eth'

// insert default apm if the provided name doesnt have the suffix
module.exports = name =>
  name.split('.').length > 1 ? name : `${name}.${DEFAULT_APM_REGISTRY}`
