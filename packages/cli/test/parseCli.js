import { init } from '../src/cli'

async function main(args) {
  return new Promise((resolve, reject) => {
    const cli = init(resolve)

    cli.parse(args, err => {
      if (err) return reject(err)
    })
  })
}

export default main
