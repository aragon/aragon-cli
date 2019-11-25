import fetch from 'node-fetch'
import { timeout, GATEWAYS } from './constants'

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
    GATEWAYS.map(gateway => queryCidAtGateway(gateway, cid))
  )

  const succeeded = results.filter(status => status.success).length
  const failed = GATEWAYS.length - succeeded

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
    gateways: GATEWAYS,
    succeeded: results.reduce((prev, current) => prev + current.succeeded, 0),
    failed: results.reduce((prev, current) => prev + current.failed, 0),
    errors: results.reduce((prev, current) => [...prev, ...current.errors], []),
  }
}
