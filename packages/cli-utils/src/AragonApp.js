import { resolve as pathResolve } from 'path'
import { readJsonSync } from 'fs-extra'
import { findProjectRoot } from './index'

export const configure = (yargs, options) => yargs
  .middleware([
    (argv) => middleware(argv, options)
  ])
  
export const middleware = (argv, options) => {
  if (shouldBeSkipped(argv, options)) return

  const { reporter } = argv

  let projectRootPath

  try {
    projectRootPath = findProjectRoot()
  } catch (err) {
    reporter.debug('AragonApp:', err.message)
    // if we are not in a project, skip this middleware
    return
  }

  const arapp = getArapp(projectRootPath)
  validateArapp(arapp)
  reporter.debug('AragonApp: arapp', arapp)
  return { arapp }
}

export const getArapp = (projectRootPath) => {
  const arappPath = pathResolve(projectRootPath, 'arapp.json')
  const arapp = readJsonSync(arappPath)
  return arapp
}

export const validateArapp = (arapp) => {
  const Ajv = require('ajv')
  const arappSchema = require('../schemas/arapp.schema')
  const ajv = new Ajv({ allErrors: true })
  const validate = ajv.compile(arappSchema)
  const valid = validate(arapp)

  if (!valid) {
    const errors = ajv.errorsText(validate.errors, {
      dataVar: 'arapp',
    })
    throw new Error(`Cannot parse the arapp.json file: ${errors}!`)
  }
}

const shouldBeSkipped = (argv, options) => {
  // todo runOn
  const { skipOn = [] } = options
  const currentCommand = argv._[0]
  return skipOn.includes(currentCommand)
}
