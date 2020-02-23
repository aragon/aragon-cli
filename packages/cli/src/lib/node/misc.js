import goplatform from 'go-platform'

/**
 * Enhance a promise with a predefined timeout, which, if reached, will throw the passed `error`.
 */
export const withTimeout = async (promise, timeout, error) => {
  let timeoutId

  const timeoutPromise = new Promise((resolve, reject) => {
    timeoutId = setTimeout(() => {
      reject(error)
    }, timeout)
  })

  try {
    await Promise.race([promise, timeoutPromise])
    /**
     * If we don't use `clearTimeout` the process will stay alive
     * until the timeout has been processed: <https://nodejs.org/api/timers.html#timers_class_timeout>
     */
    if (typeof timeoutId !== 'undefined') clearTimeout(timeoutId)
    // return the initial promise object
    return promise
  } catch (err) {
    if (typeof timeoutId !== 'undefined') clearTimeout(timeoutId)
    throw err
  }
}

/**
 * No operation.
 *
 * This function does nothing.
 *
 * Useful to assign as a default value for callbacks.
 */
export const noop = () => {}

/**
 * A logger function that uses `console.log` if the `DEBUG` environment variable is truthy,
 * `noop` otherwise.
 */
export const debugLogger = process.env.DEBUG ? console.log : noop

export const getPlatform = () => process.platform
export const getArch = () => process.arch
export const getPlatformForGO = () => goplatform.GOOS
export const getArchForGO = () => goplatform.GOARCH
