import StaticServer from 'static-server'

/**
 * Creates a static files HTTP server
 * Resolves when the server starts to listen
 * @param port 3000
 * @param rootPath Dir to serve files from
 */
export function createStaticWebserver(
  port: number,
  rootPath = '.'
): Promise<void> {
  return new Promise(resolve => {
    const server = new StaticServer({
      rootPath, // required, the root of the server file tree
      port, // required, the port to listen
      cors: '*' // optional, defaults to undefined
    })

    server.start(() => {
      resolve()
    })
  })
}
