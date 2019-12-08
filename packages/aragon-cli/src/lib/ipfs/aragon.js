import path from 'path'

export const pinArtifacts = async apiClient => {
  const files = path.resolve(require.resolve('@aragon/aragen'), '../ipfs-cache')
  return apiClient.addFromFs(files, { recursive: true, ignore: 'node_modules' })
}
