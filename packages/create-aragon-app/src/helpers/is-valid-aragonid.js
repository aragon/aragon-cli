/**
 * Validates an Aragon Id
 * @param {string} aragonId Aragon Id
 * @returns {boolean} `true` if valid
 */
function isValidAragonId(aragonId) {
  return /^[a-z0-9-]+$/.test(aragonId)
}

module.exports = isValidAragonId
