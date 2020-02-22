import goplatform from 'go-platform'

/**
 * Enhance a promise with a predefined timeout, which, if reached, will throw the passed `error`.
 */
export const withTimeout = async <T>(
  promise: Promise<T>,
  timeout: number,
  error: Error
): Promise<T> => {
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
 * No operation.
 *
 * This function does nothing.
 *
 * Useful to assign as a default value for callbacks.
 */
export const noop = (): void => {} // eslint-disable-line @typescript-eslint/no-empty-function

/**
 * A logger function that uses `console.log` if the `DEBUG` environment variable is truthy,
 * `noop` otherwise.
 */
export const debugLogger = process.env.DEBUG ? console.log : noop

export const getPlatform = (): NodeJS.Platform => process.platform
export const getArch = (): string => process.arch
export const getPlatformForGO = (): string => goplatform.GOOS
export const getArchForGO = (): string => goplatform.GOARCH
