const TaskList = require('listr')
const execa = require('execa')
const inquirer = require('inquirer')
const { promisify } = require('util')
const clone = promisify(require('git-clone'))
//
const defaultAPMName = require('../helpers/default-apm')
const listrOpts = require('../helpers/listr-options')
const { installDeps, isValidAragonId } = require('../util')
const { checkProjectExists, prepareTemplate } = require('../lib')

const templateOptions = {
  bare: {
    repo: 'aragon/aragon-bare-boilerplate',
    name: 'Aragon bare boilerplate (deprecated)',
  },
  react: {
    repo: 'aragon/aragon-react-boilerplate',
    name: 'Aragon React boilerplate',
  },
  buidler: {
    repo: 'aragon/aragon-buidler-boilerplate',
    name: 'Aragon Buidler boilerplate',
  },
  tutorial: {
    repo: 'aragon/your-first-aragon-app',
    name: 'Your first Aragon app (tutorial)',
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
        if (tmpl && !tmpl.includes('/')) {
          if (tmpl === 'react-kit') {
            throw new Error(
              `The 'react-kit' boilerplate has been deprecated and merged with 'react' boilerplate.`
            )
          } else if (!templateOptions[tmpl]) {
            throw new Error(`No template named ${tmpl} exists`)
          }
        }

        return tmpl
      },
    })
}

exports.handler = async function({
  reporter,
  name,
  template,
  path: dirPath,
  silent,
  debug,
}) {
  name = defaultAPMName(name)
  const basename = name.split('.')[0]
  const projectPath = `${dirPath}/${basename}`

  if (!template && !silent) {
    const { templateChoice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'templateChoice',
        message: 'Chose a template to scaffold from',
        choices: Object.entries(templateOptions).map(([id, { name }]) => ({
          name,
          value: id,
        })),
      },
    ])
    template = templateChoice
  } else if (silent) {
    template = 'react'
  }

  if (template === 'buidler') {
    console.log(
      `Warning: You are using the experimental "${template}" boilerplate.`
    )
  }

  const repo = (templateOptions[template] || {}).repo
  if (!repo) throw new Error(`No template repo found for ${template}`)

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
          await clone(templateUrl, projectPath, { shallow: true })
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
        task: async (ctx, task) => installDeps(projectPath, task),
      },
      {
        title: 'Check IPFS',
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
        enabled: ctx => ctx.ipfsMissing,
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
    reporter.success(`Created new application ${name} in ${basename}

Start your Aragon app by typing:

  cd ${basename}
  npm start

Visit https://hack.aragon.org/docs/cli-main-commands for more information.

`)
  })
}
