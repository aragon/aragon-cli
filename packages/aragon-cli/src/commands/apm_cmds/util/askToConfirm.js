const taskInput = require('listr-input')

const POSITIVE_ANSWERS = ['yes', 'y']
const NEGATIVE_ANSWERS = ['no', 'n', 'abort', 'a']
const ANSWERS = POSITIVE_ANSWERS.concat(NEGATIVE_ANSWERS)

/**
 * Prompt the user for confirmation inside a Listr task
 *
 * @param {string} message "Are you sure you want to do this?"
 * @param {AsyncCallback} cb Will be invoked only if the user answers yes
 */
module.exports = function askToConfirm(message, cb) {
  return taskInput(`${message} [y]es/[n]o`, {
    validate: value => ANSWERS.indexOf(value) > -1,
    done: async answer => {
      if (POSITIVE_ANSWERS.indexOf(answer) > -1) return await cb()
      else throw Error(`Aborting...`)
    },
  })
}
