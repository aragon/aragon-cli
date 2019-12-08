import test from 'ava'
import { buildClient } from '../../src/lib/start'

/**
 * Postpone until the refactor is completed
 * The current code in `/lib` includes `listr` logic, which shouldn't happen
 *
 * - build-client.js (buildClient): Skipped
 *   Would have to create a new package.json with a build:local script
 *
 * - download-client.js (downloadClient)
 *
 * - fetch-client.js (fetchClient)
 *
 * - open-client.js (openClient)
 *
 * - start-client.js (startClient)
 *
 */

/* eslint-disable-next-line ava/no-skip-test */
test.skip('Build client', async t => {
  // arrange
  await buildClient({}, '.')
})
