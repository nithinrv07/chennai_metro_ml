import test from 'node:test';
import assert from 'node:assert/strict';
import { getSimulationTrains } from '../src/utils/metroNetwork';

process.env.NODE_ENV = 'test';
const { app } = await import('../server');

// Execute actual Express route handlers without binding ports or starting Python.
async function invoke(path: string, method: 'get' | 'post', body = {}) {
  let status = 200;
  let payload: any;
  const layer = (app as any)._router.stack.find((s: any) => s.route?.path === path && s.route.methods[method]);
  assert.ok(layer, path);
  const response = { status(code: number) { status = code; return this; }, json(data: any) { payload = data; return this; } };
  await layer.route.stack[0].handle({ body }, response);
  return { status, payload };
}

const request = { station_name: 'Guindy Metro Station', destination: 'Airport', hour: 9, minute: 0,
  day_of_week: 'Monday', is_peak_hour: 1, is_weekend: 0 };

test('gateway fallback remains truthful when Python is offline or responds 503/500', async () => {
  const previous = globalThis.fetch;
  try {
    for (const code of [0, 500, 503]) {
      globalThis.fetch = async () => { if (code === 0) throw new Error('offline'); return new Response('{}', { status: code }); };
      const health = await invoke('/api/ml/health', 'get');
      assert.equal(health.payload.model_loaded, false);
      assert.equal(health.payload.status, 'offline');
      assert.equal(health.payload.accuracy_score, null);
      const trains = await invoke('/api/ml/predict-trains', 'post', request);
      assert.equal(trains.status, 200);
      assert.equal(trains.payload.source, 'gateway_fallback');
      assert.equal(trains.payload.model_loaded, false);
      assert.equal(trains.payload.ml_confidence, null);
      assert.ok(trains.payload.trains.every((t: any) => t.confidenceScore === null && t.lineColor === 'blue'));
      const crowd = await invoke('/api/ml/predict', 'post', request);
      assert.equal(crowd.payload.source, 'gateway_fallback');
      assert.equal(crowd.payload.confidence_score, null);
      assert.deepEqual(crowd.payload.coach_breakdown, crowd.payload.crowd_breakdown);
      assert.doesNotMatch(crowd.payload.recommendations.join(' '), /generated from Random Forest/);
    }
  } finally { globalThis.fetch = previous; }
});

test('offline gateway accepts canonical stations and rejects invalid destinations and flags', async () => {
  const previous = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('offline'); };
  try {
    const station = await invoke('/api/ml/predict-trains', 'post', { ...request, station_name: 'Sir Theagaraya College Station' });
    assert.equal(station.status, 200);
    assert.equal(station.payload.station_name, 'Sir Theagaraya College');
    for (const body of [{ ...request, destination: 'not a station' }, { ...request, destination: 'Guindy' }]) {
      assert.equal((await invoke('/api/ml/predict-trains', 'post', body)).status, 400);
    }
    assert.equal((await invoke('/api/ml/predict-trains', 'post', { ...request, minute: 60 })).status, 422);
    assert.equal((await invoke('/api/ml/predict-trains', 'post', { ...request, is_peak_hour: 2 })).status, 422);
    const closed = await invoke('/api/ml/predict-trains', 'post', { ...request, hour: 23 });
    assert.equal(closed.payload.service_status, 'Closed');
    assert.deepEqual(closed.payload.trains, []);
  } finally { globalThis.fetch = previous; }
});

test('gateway forwards validation errors without generating fallback trains', async () => {
  const previous = globalThis.fetch;
  try {
    for (const status of [400, 422]) {
      globalThis.fetch = async () => new Response(JSON.stringify({ detail: 'invalid request' }), { status });
      const result = await invoke('/api/ml/predict-trains', 'post', request);
      assert.equal(result.status, status);
      assert.equal(result.payload.detail, 'invalid request');
      assert.equal(result.payload.trains, undefined);
    }
  } finally { globalThis.fetch = previous; }
});

test('coach rejects missing or incompatible trains and labels fallback advice', async () => {
  const base = { origin: 'Guindy', destination: 'Airport' };
  const empty = await invoke('/api/coach/advise', 'post', { ...base, candidateBuses: [] });
  assert.equal(empty.status, 400);
  const wrongLine = getSimulationTrains('Vadapalani', 'St. Thomas Mount', 9, 0, true);
  assert.equal((await invoke('/api/coach/advise', 'post', { ...base, candidateBuses: wrongLine })).status, 400);
  const valid = await invoke('/api/coach/advise', 'post', { ...base, candidateBuses: getSimulationTrains('Guindy', 'Airport', 9, 0, true) });
  assert.equal(valid.status, 200);
  assert.equal(valid.payload.source, 'smart-coach-engine+fallback');
  assert.doesNotMatch(valid.payload.advice.comparisonDelta, /Random Forest inference/);
  assert.doesNotMatch(valid.payload.advice.alternativeTip, /guaranteed seats|BL-112/);
});
