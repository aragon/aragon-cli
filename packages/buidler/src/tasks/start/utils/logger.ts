import chalk from 'chalk'

const mainTag = chalk.gray('main | ')
const frontTag = chalk.yellow('frontend | ')
const backTag = chalk.blue('backend  | ')

function _prependTag(lines: string, tag: string): string {
  return lines
    .split('\n')
    .map(line => tag + line)
    .join('\n')
}

export function logMain(data: string): void {
  // eslint-disable-next-line no-console
  console.log(_prependTag(data, mainTag))
}

export function logFront(data: string): void {
  // eslint-disable-next-line no-console
  console.log(_prependTag(data, frontTag))
}

export function logBack(data: string): void {
  // eslint-disable-next-line no-console
  console.log(_prependTag(data, backTag))
}
