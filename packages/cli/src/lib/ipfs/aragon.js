import { getIpfsCacheFiles } from '@aragon/toolkit'

export const pinArtifacts = async httpClient => {
  const files = getIpfsCacheFiles()
  console.log('>>filesPath:', files)
  return httpClient.addFromFs(files, {
    recursive: true,
    ignore: 'node_modules',
  })
}
