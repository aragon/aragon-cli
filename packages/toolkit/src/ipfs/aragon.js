import path from 'path'

export const pinArtifacts = async httpClient => {
  const files = path.resolve(require.resolve('@aragon/aragen'), '../ipfs-cache')
  return httpClient.addFromFs(files, {
    recursive: true,
    ignore: 'node_modules',
  })
}
