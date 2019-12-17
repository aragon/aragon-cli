import execa from 'execa'

export async function compileContracts() {
  try {
    await execa('truffle', ['compile'])
    return 'Contracts compiled'
  } catch (err) {
    throw new Error(
      `${err.message}\n${err.stderr}\n\nFailed to compile. See above output.`
    )
  }
}
