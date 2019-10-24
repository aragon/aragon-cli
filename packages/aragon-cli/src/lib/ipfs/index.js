import chalk from 'chalk'
import byteSize from 'byte-size'
import { stringifyTree } from 'stringify-tree'
import ipfsAPI from 'ipfs-http-client' // TODO: import only submodules?
import fetch from 'node-fetch'
import { readJson } from 'fs-extra'
import { join as joinPath } from 'path'
import { homedir } from 'os'
import { isPortTaken } from '../../util'
import getFolderSize from 'get-folder-size'
import url from 'url'

const FETCH_TIMEOUT = 20000 // 20s
const FETCH_TIMEOUT_ERR = 'Request timed out'

export async function ensureConnection(apiAddress) {
  try {
    const client = connectToAPI(apiAddress)
    await client.id()
    return {
      client,
    }
  } catch (e) {
    throw new Error(
      `Could not connect to the IPFS API at ${JSON.stringify(apiAddress)}`
    )
  }
}

export function connectToAPI(apiAddress) {
  return ipfsAPI(apiAddress)
}

export function parseAddressAsURL(address) {
  const uri = new url.URL(address)
  return {
    protocol: uri.protocol.replace(':', ''),
    host: uri.hostname,
    port: parseInt(uri.port),
  }
}

/**
 * Check whether the daemon is running by connecting to the API.
 *
 * @param {URL} apiAddress a `URL` object
 * @returns {boolean} true if it is running
 */
export async function isDaemonRunning(apiAddress) {
  const portTaken = await isPortTaken(apiAddress.port)

  if (!portTaken) {
    return false
  }

  try {
    // if port is taken, connect to the API,
    // otherwise we can assume the port is taken by a different process
    await ensureConnection(apiAddress)
    return true
  } catch (e) {
    return false
  }
}

export async function getMerkleDAG(client, cid, opts = {}) {
  const merkleDAG = parseMerkleDAG(await client.object.get(cid))
  merkleDAG.cid = cid

  if (opts.recursive && merkleDAG.isDir && merkleDAG.links) {
    // fetch the MerkleDAG of each link recursively
    const promises = merkleDAG.links.map(async link => {
      const object = await getMerkleDAG(client, link.cid, opts)
      return Object.assign(link, object)
    })

    return Promise.all(promises).then(links => {
      merkleDAG.links = links
      return merkleDAG
    })
  }

  return merkleDAG
}

// object.get returns an object of type DAGNode
// https://github.com/ipld/js-ipld-dag-pb#dagnode-instance-methods-and-properties
function parseMerkleDAG(dagNode) {
  const parsed = dagNode.toJSON()
  // add relevant data
  parsed.isDir = isDir(parsed.data)
  // remove irrelevant data
  delete parsed.data
  if (!parsed.isDir) {
    // if it's a big file it will have links to its other chunks
    delete parsed.links
  }
  return parsed
}

function isDir(data) {
  return data.length === 2 && data.toString() === '\u0008\u0001'
}

function stringifyMerkleDAGNode(merkleDAG) {
  // ${merkleDAG.isDir ? '📁' : ''}
  const cid = merkleDAG.cid
  const name = merkleDAG.name || 'root'
  const parsedSize = byteSize(merkleDAG.size)
  const size = parsedSize.value + parsedSize.unit
  const delimiter = chalk.gray(' - ')

  return [name, size, chalk.gray(cid)].join(delimiter)
}

export function stringifyMerkleDAG(merkleDAG) {
  return stringifyTree(
    merkleDAG,
    node => stringifyMerkleDAGNode(node),
    node => node.links
  )
}

export function extractCIDsFromMerkleDAG(merkleDAG, opts = {}) {
  const CIDs = []
  CIDs.push(merkleDAG.cid)

  if (opts.recursive && merkleDAG.isDir && merkleDAG.links) {
    merkleDAG.links
      .map(merkleDAGOfLink => extractCIDsFromMerkleDAG(merkleDAGOfLink, opts))
      .map(CIDsOfLink => CIDs.push(...CIDsOfLink))
  }

  return CIDs
}

function timeout() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(FETCH_TIMEOUT_ERR)
    }, FETCH_TIMEOUT)
  })
}

const gateways = [
  'https://ipfs.io/ipfs',
  'https://ipfs.infura.io/ipfs',
  'https://cloudflare-ipfs.com/ipfs',
  'https://ipfs.eth.aragon.network/ipfs',
  'https://ipfs.jes.xxx/ipfs',
  'https://www.eternum.io/ipfs',
  'https://ipfs.wa.hle.rs/ipfs',
  'https://siderus.io/ipfs/',
]

async function queryCidAtGateway(gateway, cid) {
  try {
    await Promise.race([
      fetch(`${gateway}/${cid}`),
      // Add a timeout because the Fetch API does not implement them
      timeout(),
    ])

    return {
      success: true,
      cid,
      gateway,
    }
  } catch (err) {
    return {
      success: false,
      cid,
      gateway,
      error: err,
    }
  }
}

async function propagateFile(cid, logger) {
  const results = await Promise.all(
    gateways.map(gateway => queryCidAtGateway(gateway, cid))
  )

  const succeeded = results.filter(status => status.success).length
  const failed = gateways.length - succeeded

  logger(
    `Queried ${cid} at ${succeeded} gateways successfully, ${failed} failed.`
  )

  const errors = results
    .filter(result => result.error)
    .map(result => result.error)

  return {
    succeeded,
    failed,
    errors,
  }
}

export async function propagateFiles(CIDs, logger = () => {}) {
  const results = await Promise.all(CIDs.map(cid => propagateFile(cid, logger)))
  return {
    gateways,
    succeeded: results.reduce((prev, current) => prev + current.succeeded, 0),
    failed: results.reduce((prev, current) => prev + current.failed, 0),
    errors: results.reduce((prev, current) => [...prev, ...current.errors], []),
  }
}

export function getDefaultRepoPath() {
  const homedirPath = homedir()
  return joinPath(homedirPath, '.ipfs')
}

export async function getRepoVersion(repoLocation) {
  const versionFilePath = joinPath(repoLocation, 'version')
  const version = await readJson(versionFilePath)
  return version
}

export async function getRepoSize(repoLocation) {
  return new Promise((resolve, reject) => {
    getFolderSize(repoLocation, (err, size) => {
      if (err) {
        reject(err)
      } else {
        const humanReadableSize = byteSize(size)
        resolve(humanReadableSize)
      }
    })
  })
}

export async function getRepoConfig(repoLocation) {
  const configFilePath = joinPath(repoLocation, 'config')
  const config = await readJson(configFilePath)
  return config
}

export function getPortsConfig(repoConfig) {
  return {
    // default: "/ip4/127.0.0.1/tcp/5001"
    api: repoConfig.Addresses.API.split('/').pop(),
    // default: "/ip4/127.0.0.1/tcp/8080"
    gateway: repoConfig.Addresses.Gateway.split('/').pop(),
    // default: [
    //   "/ip4/0.0.0.0/tcp/4001"
    //   "/ip6/::/tcp/4001"
    // ]
    swarm: repoConfig.Addresses.Swarm[0].split('/').pop(),
  }
}

export function getPeerIDConfig(repoConfig) {
  return repoConfig.Identity.PeerID
}
