const options = {
  BUILD: {
    name: 'build',
    data: {
      description:
        'Whether publish should try to build the app before publishing, running the script specified in --build-script',
      default: true,
      boolean: true,
    },
  },
  BUILD_SCRIPT: {
    name: 'build-script',
    data: {
      description: 'The npm script that will be run when building the app',
      default: 'build',
    },
  },
  PREPUBLISH: {
    name: 'prepublish',
    data: {
      description:
        'Whether publish should run prepublish script specified in --prepublish-script before publishing',
      default: true,
      boolean: true,
    },
  },
  PREPUBLISH_SCRIPT: {
    name: 'prepublish-script',
    data: {
      description: 'The npm script that will be run before publishing the app',
      default: 'prepublishOnly',
    },
  },
  FILES: {
    name: 'files',
    data: {
      description:
        'Path(s) to directories containing files to publish. Specify multiple times to include multiple files.',
      default: ['.'],
      array: true,
    },
  },
}

const addOption = (command, option) => {
  if (!option) {
    throw new Error('Unrecognized option')
  }

  command.option(option.name, option.data)
}

module.exports = {
  options,
  addOption,
}
