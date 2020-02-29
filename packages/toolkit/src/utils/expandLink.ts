/**
 * TODO: What is this?
 */
interface AragonContractLink {
  name: string
  address: string
  placeholder: string
  regex: RegExp
  addressBytes: string
}

/**
 * Expand a linkable contract adding a placeholder
 *
 * @param link
 * @return link mutated
 */
export const expandLink = (link: AragonContractLink): AragonContractLink => {
  const { name, address } = link
  const placeholder = `__${name}${'_'.repeat(38 - name.length)}`
  link.placeholder = placeholder
  link.regex = new RegExp(placeholder, 'g')
  link.addressBytes = address.slice(0, 2) === '0x' ? address.slice(2) : address
  return link
}
