import 'core-js/stable'
import 'regenerator-runtime/runtime'
import Aragon, { events } from '@aragon/api'

const app = new Aragon()

app.store(
  async (state, { event }) => {
    console.log(`script.js: state update`)

    try {
      switch (event) {
        case 'Increment':
          return { ...state, count: await getValue() }
        case 'Decrement':
          return { ...state, count: await getValue() }
        case events.SYNC_STATUS_SYNCING:
          return { ...state, isSyncing: true }
        case events.SYNC_STATUS_SYNCED:
          return { ...state, isSyncing: false }
        default:
          return state
      }
    } catch (err) {
      console.log(err)
    }
  },
  {
    init: initializeState(),
  }
)

/***********************
 *                     *
 *   Event Handlers    *
 *                     *
 ***********************/

function initializeState() {
  return async cachedState => {
    console.log(`script.js: init state`)

    const version = await getVersion()

    return {
      ...cachedState,
      count: 0,
      version
    }
  }
}

async function getValue() {
  return parseInt(await app.call('value').toPromise(), 10)
}

async function getVersion() {
  return parseInt(await app.call('getVersion').toPromise(), 10)
}
