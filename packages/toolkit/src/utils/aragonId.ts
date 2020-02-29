const ARAGON_DOMAIN = 'aragonid.eth'

/**
 * Validates an Aragon Id
 * @param aragonId Aragon Id
 * @returns true if valid
 */
export function isValidAragonId(aragonId: string): boolean {
  return /^[a-z0-9-]+$/.test(aragonId)
}

/**
 * Convert a DAO id to its subdomain
 * E.g. mydao -> mydao.aragonid.eth
 * @param aragonId Aragon Id
 * @returns DAO subdomain
 */
export function convertDAOIdToSubdomain(aragonId: string): string {
  // If already a subdomain, return
  if (new RegExp(`^([a-z0-9-]+).${ARAGON_DOMAIN}$`).test(aragonId))
    return aragonId

  if (!isValidAragonId(aragonId)) throw new Error(`Invalid DAO Id: ${aragonId}`)

  return `${aragonId}.${ARAGON_DOMAIN}`
}
