module.exports = function (wallaby) {
  return {
    files: [
      'src/**/*.js'
    ],

    tests: [
      'test/**/*'
    ],

    env: {
      type: 'node',
      runner: 'node'
    },

    testFramework: 'ava'
  }
}
