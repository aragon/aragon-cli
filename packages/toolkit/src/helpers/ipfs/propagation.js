import fetch from 'node-fetch'
//
import { withTimeout, noop } from '../node'
import {
  GATEWAY_FETCH_TIMEOUT,
  GATEWAY_FETCH_TIMEOUT_MSG,
  DEFAULT_GATEWAYS,
} from './constants'

async function queryCidAtGateway(gateway, cid) {
  try {
    await withTimeout(
      fetch(`${gateway}/${cid}`),
      GATEWAY_FETCH_TIMEOUT,
      new Error(GATEWAY_FETCH_TIMEOUT_MSG)
    )

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

export async function propagateFile(cid, options = {}) {
  const { progressCallback = noop, gateways = DEFAULT_GATEWAYS } = options

  const results = await Promise.all(
    gateways.map(gateway => queryCidAtGateway(gateway, cid))
  )

  const succeeded = results.filter(status => status.success).length
  const failed = gateways.length - succeeded

  progressCallback(1, { cid, succeeded, failed })

  const errors = results
    .filter(result => result.error)
    .map(result => result.error)

  return {
    succeeded,
    failed,
    errors,
  }
}

export async function propagateFiles(CIDs, options = {}) {
  const results = await Promise.all(
    CIDs.map(cid => propagateFile(cid, options))
  )

  const { gateways = DEFAULT_GATEWAYS } = options
  return {
    gateways,
    succeeded: results.reduce((prev, current) => prev + current.succeeded, 0),
    failed: results.reduce((prev, current) => prev + current.failed, 0),
    errors: results.reduce((prev, current) => [...prev, ...current.errors], []),
  }
}
