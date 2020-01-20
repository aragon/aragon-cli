import namehash from 'eth-ens-namehash'

export function getAppId(name: string, domain = 'aragonpm.eth'): string {
  return namehash.hash(`${name}.${domain}`)
}
