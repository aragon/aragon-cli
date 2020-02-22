/**
 * Check eth address equality without checksums
 * @param first address
 * @param second address
 * @returns address equality
 */
export function addressesEqual(first: string, second: string): boolean {
  first = first && first.toLowerCase()
  second = second && second.toLowerCase()
  return first === second
}

/**
 * Check is address format is valid. Does not check checksum
 * @param addr
 */
export function isAddress(addr: string): boolean {
  return /0x[a-fA-F0-9]{40}/.test(addr)
}
