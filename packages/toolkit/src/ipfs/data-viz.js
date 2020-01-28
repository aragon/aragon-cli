import chalk from 'chalk'
import byteSize from 'byte-size'
import { stringifyTree } from 'stringify-tree'

export function stringifyMerkleDAG(merkleDAG) {
  return stringifyTree(
    merkleDAG,
    node => stringifyMerkleDAGNode(node),
    node => node.links
  )
}

export function stringifyMerkleDAGNode(merkleDAG) {
  const cid = merkleDAG.cid
  const name = merkleDAG.name || 'root'
  const nameWithIcon = `${merkleDAG.isDir ? '📁  ' : '📃  '}${name}`
  const parsedSize = byteSize(merkleDAG.size)
  const size = parsedSize.value + parsedSize.unit
  const delimiter = chalk.gray(' - ')

  return [nameWithIcon, size, chalk.gray(cid)].join(delimiter)
}
