import 'core-js/stable'
import 'regenerator-runtime/runtime'
import Aragon, { events } from '@aragon/api'

const app = new Aragon()

app.store(
  async (state, { event }) => {
    console.log(`script.js: state update`)

    const version = await getVersion()
    const newState = {
      ...state,
      version
    }
    console.log(`newState`, newState)

    try {
      switch (event) {
        case 'Increment':
          return { ...newState, count: await getValue() }
        case 'Decrement':
          return { ...newState, count: await getValue() }
        case events.SYNC_STATUS_SYNCING:
          return { ...newState, isSyncing: true }
        case events.SYNC_STATUS_SYNCED:
          return { ...newState, isSyncing: false }
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
