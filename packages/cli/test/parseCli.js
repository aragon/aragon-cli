import { init } from '../src/cli'

async function main(args) {
  return new Promise((res, reject) => { 
    const cli = init(res)
    
    cli.parse(args, (err) => {
      if (err)
        return reject(err)
    })
  })
  
}

export default main

