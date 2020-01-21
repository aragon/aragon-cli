import { assert } from 'chai'
import { execaPipe } from '~/src/tasks/start/utils/execa'
import * as path from 'path'

describe('execa.ts', function() {
  describe('when calling pwd', function() {
    let res: any

    before('call pwd', async function() {
      res = await execaPipe('pwd', ['-L', '-P'], {})
    })

    it('should have printed console output with the expected path', async function() {
      const dir = path.basename(res.stdout)
      assert.equal(dir, 'buidler-project')
    })

    it('should have ended with exit code 0', async function() {
      assert.equal(res.exitCode, 0, 'Invalid exit code.')
    })

    it.skip('more tests needed', async function() {})
  })
})
