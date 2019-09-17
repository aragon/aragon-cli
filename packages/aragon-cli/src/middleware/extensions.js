import execa from 'execa'
import { getBinary } from '@aragon/cli-utils'

export const configure = yargs => {
  const commandName = 'ipfs'
  const commandDescription = 'Manage an IPFS node'

  const builderFn = yargs =>
    yargs
      // extensions have custom options
      .strict(false)
      // extensions have their own help and version commands
      .help(false)
      .version(false)

  const handlerFn = async () => {
    const extensionArgs = process.argv.slice(3)
    try {
      await callExtension(commandName, extensionArgs, {
        stdout: process.stdout,
        stderr: process.stderr,
      })
    } catch (err) {
      // exit with the same code as the extension
      process.exit(err.code)
    }
  }

  yargs.command(commandName, commandDescription, builderFn, handlerFn)
}

const callExtension = (extensionName, extensionArgs, execaOpts) => {
  const binaryName = `aragon-${extensionName}`
  const binaryLocation = getBinary(binaryName)
  return execa(binaryLocation, extensionArgs, execaOpts)
}
