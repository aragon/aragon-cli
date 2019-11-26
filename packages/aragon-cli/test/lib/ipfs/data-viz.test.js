import test from 'ava'
import stripAnsi from 'strip-ansi'
import {
  stringifyMerkleDAG,
  stringifyMerkleDAGNode,
} from '../../../src/lib/ipfs/data-viz'

const merkleDagNode = {
  cid: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
  name: 'arapp.json',
  size: 3461235,
}

// stripAnsi is necessary since it causes problems in CI
// Where it does not matches the snapshot

test('Should format a merkle DAG node', t => {
  const formatedOutput = stringifyMerkleDAGNode(merkleDagNode)
  t.snapshot(
    stripAnsi(formatedOutput),
    'The formated display output is correct'
  )
})

test('Should format a merkle DAG tree', t => {
  const merkleDagTree = {
    ...merkleDagNode,
    links: [merkleDagNode, merkleDagNode],
  }
  const formatedOutput = stringifyMerkleDAG(merkleDagTree)
  t.snapshot(
    stripAnsi(formatedOutput),
    'The formated display output is correct'
  )
})
