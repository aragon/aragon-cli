import chalk from 'chalk'

const frontTag = chalk.yellow('front | ')
const backTag = chalk.blue('back  | ')

function prependTag(lines: string, tag: string): string {
  return lines
    .split('\n')
    .map(line => tag + line)
    .join('\n')
}

export function logFront(data: string) {
  console.log(prependTag(data, frontTag))
}

export function logBack(data: string) {
  console.log(prependTag(data, backTag))
}
