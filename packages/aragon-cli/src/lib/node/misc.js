/**
 * If we don't use `clearTimeout` the process will stay alive
 * until the timeout has been processed: <https://nodejs.org/api/timers.html#timers_class_timeout>
 */
export const withTimeout = async (promise, timeout, error) => {
  let timeoutObject

  const timeoutPromise = new Promise((resolve, reject) => {
    timeoutObject = setTimeout(() => {
      reject(error)
    }, timeout)
  })

  await Promise.race([promise, timeoutPromise])

  clearTimeout(timeoutObject)

  // return the initial promise object
  return promise
}
