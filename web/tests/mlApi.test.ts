import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { fetchMLTrains } from '../src/utils/mlApi';
import { getRecalculatedTrains } from '../src/utils/timeManager';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const predict = () => fetchMLTrains('Guindy Metro Station', 'Airport', 10, 30, 'Wednesday', false, true);

for (const status of [404, 405, 500, 503]) {
  test(`HTTP ${status} uses fallback instead of claiming the metro is closed`, async () => {
    globalThis.fetch = async () => new Response('Unavailable', { status });
    assert.equal(await predict(), null);
    assert.ok(getRecalculatedTrains(10, 30, 'Wednesday').length > 0);
  });
}

test('invalid station remains a validation error', async () => {
  globalThis.fetch = async () => Response.json({ detail: 'Invalid station' }, { status: 400 });
  assert.equal((await predict())?.service_status, 'Invalid Station');
});

test('explicit successful closure response is preserved', async () => {
  globalThis.fetch = async () => Response.json({ service_status: 'Closed', trains: [] });
  assert.equal((await predict())?.service_status, 'Closed');
});

test('static SPA HTML uses fallback', async () => {
  globalThis.fetch = async () => new Response('<html>SPA</html>');
  assert.equal(await predict(), null);
});

test('local fallback respects opening and closing boundaries', () => {
  assert.equal(getRecalculatedTrains(4, 59, 'Wednesday').length, 0);
  assert.ok(getRecalculatedTrains(5, 0, 'Wednesday').length > 0);
  assert.ok(getRecalculatedTrains(22, 59, 'Wednesday').length > 0);
  assert.equal(getRecalculatedTrains(23, 0, 'Wednesday').length, 0);
});
