const taskInput = require('listr-input')

const POSITIVE_ANSWERS = ['yes', 'y']
const NEGATIVE_ANSWERS = ['no', 'n', 'abort', 'a']
const ANSWERS = POSITIVE_ANSWERS.concat(NEGATIVE_ANSWERS)

/**
 * Prompt the user for confirmation inside a Listr task
 *
 * @param {string} message "Are you sure you want to do this?"
 * @param {AsyncCallback} cb Will be invoked only if the user answers yes
 * @return {any} cb() return value
 */
module.exports = function askToConfirm(message, cb) {
  return taskInput(`${message} [y]es/[n]o`, {
    validate: value => ANSWERS.includes(value),
    done: async answer => {
      if (POSITIVE_ANSWERS.includes(answer)) return cb()
      else throw Error(`Aborting...`)
    },
  })
}
