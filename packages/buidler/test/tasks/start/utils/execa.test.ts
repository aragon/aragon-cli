import { execaPipe } from '../../../../src/tasks/start/utils/execa';
import { assert } from 'chai';
import * as path from 'path';

describe('execa', () => {
  describe('when calling pwd', () => {
    let res;

    before('call pwd', async () => {
      res = await execaPipe('pwd', ['-L', '-P'], {});
    });

    it('should have printed console output with the expected path', async () => {
      const dir = path.basename(res.stdout);
      assert.equal(dir, 'buidler');
    });

    it('should have ended with exit code 0', async () => {
      assert.equal(res.code, 0, 'Invalid exit code.');
    });
  });
});
