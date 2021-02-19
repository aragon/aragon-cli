import stripAnsi from 'strip-ansi'
import {
  stringifyMerkleDAG,
  stringifyMerkleDAGNode,
} from '../../src/ipfs/data-viz'

const merkleDagNode = {
  cid: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
  name: 'arapp.json',
  size: 3461235,
}

// stripAnsi is necessary since it causes problems in CI
// Where it does not matches the snapshot

test('Should format a merkle DAG node', () => {
  const formatedOutput = stringifyMerkleDAGNode(merkleDagNode)
  expect(stripAnsi(formatedOutput)).toMatchSnapshot('The formated display output is correct')
})

test('Should format a merkle DAG tree', () => {
  const merkleDagTree = {
    ...merkleDagNode,
    links: [merkleDagNode, merkleDagNode],
  }
  const formatedOutput = stringifyMerkleDAG(merkleDagTree)
  expect(stripAnsi(formatedOutput)).toMatchSnapshot('The formated display output is correct')
})
