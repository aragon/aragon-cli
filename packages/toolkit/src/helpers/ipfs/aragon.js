import { getIpfsCacheFiles } from '../../util'

export const pinArtifacts = async httpClient => {
  const files = getIpfsCacheFiles()
  return httpClient.addFromFs(files, {
    recursive: true,
    ignore: 'node_modules',
  })
}
