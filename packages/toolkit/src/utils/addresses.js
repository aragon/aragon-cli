/**
 * Check eth address equality without checksums
 * @param {string} first address
 * @param {string} second address
 * @returns {boolean} address equality
 */
export function addressesEqual(first, second) {
  first = first && first.toLowerCase()
  second = second && second.toLowerCase()
  return first === second
}

export const isAddress = addr => /0x[a-fA-F0-9]{40}/.test(addr)
