import http from 'http'
import url from 'url'
import fs from 'fs'
import path from 'path'

// maps file extention to MIME typere
const map: { [ext: string]: string } = {
  '.ico': 'image/x-icon',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword'
}

/**
 * Creates a static files HTTP server
 * Resolves when the server starts to listen
 * Partially from https://stackoverflow.com/questions/16333790/node-js-quick-file-server-static-files-over-http
 * @param port 3000
 * @param rootPath Dir to serve files from
 */
export function createStaticWebserver(
  port: number,
  rootPath = '.'
): Promise<void> {
  return new Promise(resolve => {
    http
      .createServer((req, res) => {
        // parse URL
        const parsedUrl = url.parse(req.url || '')
        // extract URL path
        const pathname = path.join(rootPath, parsedUrl.pathname || '')
        // based on the URL path, extract the file extention. e.g. .js, .doc, ...
        const ext = path.parse(pathname).ext || '.html'

        fs.exists(pathname, exist => {
          if (!exist) {
            // if the file is not found, return 404
            res.statusCode = 404
            return res.end(`File ${pathname} not found!`)
          }

          // if is a directory search for index file matching the extention
          const filepath = fs.statSync(pathname).isDirectory()
            ? path.join(pathname, 'index' + ext)
            : pathname

          // read file from file system
          fs.readFile(filepath, (err, data) => {
            if (err) {
              res.statusCode = 500
              res.end(`Error getting the file: ${err}.`)
            } else {
              // if the file is found, set Content-type and send data
              res.setHeader('Content-type', map[ext] || 'text/plain')
              res.end(data)
            }
          })
        })
      })
      .listen(port, () => {
        resolve()
      })
  })
}
