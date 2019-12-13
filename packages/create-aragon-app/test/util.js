import os from 'os'
import execa from 'execa'
import path from 'path'

/**
 *
 * Run a command using the freshly compiled aragonCLI build from the "dist" folder.
 *
 * @param {Array<string>} args the arguments to call the CLI with, e.g.: ['dao', 'new']
 * @return {Promise<string>} stdout
 */
export const runCreateAragonApp = async (args, verbose = false) => {
  const subprocess = execa('node', ['dist/index.js', ...args])
  if (verbose) {
    console.log(`\n>>> ${args.join(' ')}`)
    subprocess.stdout.pipe(process.stdout)
  }
  return subprocess
}

/**
 * Some characters are rendered differently depending on the OS.
 *
 * @param {string} stdout
 */
export function normalizeOutput(stdout) {
  const next = stdout
    // remove user-specific paths
    .replace(getMonorepoPath(), 'path/to/cli-monorepo')
    .replace(/❯/g, '>')
    .replace(/ℹ/g, 'i')
    // TODO: remove after https://github.com/aragon/aragon-cli/issues/367 is fixed
    .replace(/cli.js/g, 'aragon')
    // replace homedir in paths
    .replace(new RegExp(os.homedir(), 'g'), '~')
    // sometimes there's an extra LF
    .trim()

  return next
}

export const getMonorepoPath = () => path.resolve(__dirname, '../../..')
