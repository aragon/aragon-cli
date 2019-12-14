import goplatform from 'go-platform'

export const withTimeout = async (promise, timeout, error) => {
  let timeoutObject

  const timeoutPromise = new Promise((resolve, reject) => {
    timeoutObject = setTimeout(() => {
      reject(error)
    }, timeout)
  })

  try {
    await Promise.race([promise, timeoutPromise])
    /**
     * If we don't use `clearTimeout` the process will stay alive
     * until the timeout has been processed: <https://nodejs.org/api/timers.html#timers_class_timeout>
     */
    clearTimeout(timeoutObject)
    // return the initial promise object
    return promise
  } catch (err) {
    clearTimeout(timeoutObject)
    throw err
  }
}

/**
 * No operation, this function will do nothing.
 *
 * A useful utility to assign as a default value for callbacks.
 */
export const noop = () => {}
export const debugLogger = process.env.DEBUG ? console.log : () => {}

export const getPlatform = () => process.platform
export const getArch = () => process.arch
export const getPlatformForGO = () => goplatform.GOOS
export const getArchForGO = () => goplatform.GOARCH
