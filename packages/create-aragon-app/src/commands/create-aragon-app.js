const TaskList = require('listr')
const execa = require('execa')
const { promisify } = require('util')
const clone = promisify(require('git-clone'))
const commandExistsSync = require('command-exists').sync
//
const defaultAPMName = require('../helpers/default-apm')
const isValidAragonId = require('../helpers/is-valid-aragonid')
const listrOpts = require('../helpers/listr-options')
const { installDeps } = require('../util')
const { checkProjectExists, prepareTemplate } = require('../lib')

const templateOptions = {
  react: {
    repo: 'aragon/aragon-react-boilerplate',
    name: 'Aragon React boilerplate',
  },
  tutorial: {
    repo: 'aragon/your-first-aragon-app',
    name: 'Your first Aragon app (tutorial)',
  },
  reactWithCli: {
    repo: 'aragon/aragon-react-boilerplate',
    name: 'Aragon react boilerplate with aragonCLI (deprecated)',
  },
}

// $0 because this is the default command
exports.command = '$0 <name> [template]'

exports.describe = 'Create a new aragon application'

exports.builder = yargs => {
  return yargs
    .positional('name', {
      description: 'The application name (appname.aragonpm.eth)',
    })
    .option('path', {
      description: 'Where to create the new app',
      default: process.cwd(),
    })
    .positional('template', {
      description: `The template to scaffold from (${Object.keys(
        templateOptions
      ).join(', ')})`,
      coerce: function resolveTemplateName(tmpl) {
        if (!templateOptions[tmpl]) {
          throw new Error(`No template named ${tmpl} exists`)
        }
        return tmpl
      },
      default: 'react',
    })
    .option('install', {
      description: 'Whether or not to install dependencies',
      default: true,
      boolean: true,
    })
}

exports.handler = async function({
  reporter,
  name,
  template,
  path: dirPath,
  install,
  silent,
  debug,
}) {
  name = defaultAPMName(name)
  const basename = name.split('.')[0]
  const projectPath = `${dirPath}/${basename}`

  const oldTemplate = template === 'reactWithCli'

  if (oldTemplate) {
    reporter.warning(
      `You are using a deprecated boilerplate that use the aragonCLI for development. We encourage the use of the Aragon buidler plugin instead.
      `
    )
  }

  const repo = (templateOptions[template] || {}).repo

  const checkout = oldTemplate ? 'tags/react-with-cli' : ''

  const templateUrl = `https://github.com/${repo}`

  const tasks = new TaskList(
    [
      {
        title: 'Preparing initialization',
        task: async (ctx, task) => {
          task.output = 'Checking if project folder already exists...'
          if (!isValidAragonId(basename)) {
            throw new Error(
              reporter.error(
                'Invalid project name. Please only use lowercase alphanumeric and hyphen characters.'
              )
            )
          }

          await checkProjectExists(dirPath, basename)
        },
      },
      {
        title: 'Cloning app template',
        task: async (ctx, task) => {
          task.output = `Cloning ${templateUrl} into ${projectPath}...`
          await clone(templateUrl, projectPath, { checkout })
        },
      },
      {
        title: 'Preparing template',
        task: async (ctx, task) => {
          task.output = 'Initializing arapp.json and removing Git repository'
          await prepareTemplate(dirPath, basename, name)
        },
        enabled: () => !templateUrl.includes('your-first-aragon-app'),
      },
      {
        title: 'Installing package dependencies',
        enabled: () => install,
        task: async (ctx, task) => {
          task.output =
            'Installing package dependencies... (might take a couple of minutes)'
          await installDeps(oldTemplate, projectPath, task)
        },
      },
      {
        title: 'Check IPFS',
        enabled: () => oldTemplate && install,
        task: async (ctx, task) => {
          try {
            ctx.ipfsMissing = false
            await execa('ipfs', ['version'], { cwd: projectPath })
          } catch {
            ctx.ipfsMissing = true
          }
        },
      },
      {
        title: 'Installing IPFS',
        enabled: ctx => oldTemplate && install && ctx.ipfsMissing,
        task: async (ctx, task) => {
          await execa(
            'npx',
            ['aragon', 'ipfs', 'install', '--skip-confirmation'],
            { cwd: projectPath }
          )
        },
      },
    ],
    listrOpts(silent, debug)
  )

  return tasks.run().then(() => {
    reporter.success(`Created new application ${name} in path ./${basename}/\n`)

    if (template === 'react')
      reporter.info(`Start your Aragon app by typing:

    cd ${basename}
    ${commandExistsSync('yarn') ? 'yarn' : 'npm'} start
  
  Visit https://hack.aragon.org/docs for more information.
  
  `)

    process.exit()
  })
}
