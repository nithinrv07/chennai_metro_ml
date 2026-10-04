import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { stations, resolveStation, planRoute, getSimulationTrains, servesJourney } from '../src/utils/metroNetwork';
import { getRecalculatedTrains, evaluatePeakStatus } from '../src/utils/timeManager';
import { ALL_METRO_STATIONS, INITIAL_PROFILE, POPULAR_DESTINATIONS } from '../src/data/transitData';
import { fetchMLTrains } from '../src/utils/mlApi';
import { LatestRequest, normalizeTrain } from '../src/utils/predictionState';
import { fetchWithTimeout } from '../src/utils/fetchWithTimeout';
import { computeJourneyOptions } from '../src/utils/journeyEngine';
import { SmartCoach } from '../src/components/SmartCoach';
import { BoardingProbabilityEngine } from '../src/components/BoardingProbabilityEngine';

test('all UI station names and destination aliases resolve without collisions', () => {
  for (const station of ALL_METRO_STATIONS) assert.equal(resolveStation(station.name)?.id, station.id, station.name);
  for (const destination of POPULAR_DESTINATIONS) assert.ok(resolveStation(destination.name), destination.name);
  assert.equal(resolveStation('New Washermanpet')?.id, 'stop-new-washermanpet');
  assert.equal(resolveStation('Sir Theagaraya College Station')?.id, 'stop-sir-theagaraya');
  assert.equal(resolveStation('unknown destination'), undefined);
});

test('Python and TypeScript choose the same first leg for every station pair', () => {
  const script = `import json\nfrom metro_network import STATIONS,plan_route\nprint(json.dumps({o+':'+d:plan_route(o,d) for o in STATIONS for d in STATIONS}))`;
  const python = JSON.parse(execFileSync(process.env.METRO_TEST_PYTHON || 'python3', ['-c', script], { cwd: '..', encoding: 'utf8' }));
  for (const origin of stations) for (const destination of stations) {
    const ts = planRoute(origin.id, destination.id), py = python[`${origin.id}:${destination.id}`];
    if (!ts) { assert.equal(py, null); continue; }
    for (const key of ['line', 'direction', 'originId', 'destinationId', 'targetId', 'terminusId', 'servedStationIds']) {
      assert.deepEqual(ts[key as keyof typeof ts], py[key], `${origin.id} -> ${destination.id}: ${key}`);
    }
    assert.equal(ts.transferId || null, py.transferId);
    const trains = getSimulationTrains(origin.id, destination.id, 9, 0, true);
    assert.ok(trains.every(t => servesJourney(t, origin.id, destination.id)));
    assert.ok(trains.every(t => t.confidenceScore === null && t.source === 'local_demo'));
  }
});

test('local fallback excludes wrong-line trains and respects closed hours including weekends', () => {
  const guindy = ALL_METRO_STATIONS.find(s => s.id === 'stop-guindy')!;
  const vadapalani = ALL_METRO_STATIONS.find(s => s.id === 'stop-vadapalani')!;
  assert.ok(getRecalculatedTrains(9, 0, 'Monday', guindy, 'Egmore').every(t => t.lineColor === 'blue'));
  assert.ok(getRecalculatedTrains(9, 0, 'Monday', vadapalani, 'St. Thomas Mount').every(t => t.terminusId === 'stop-st-thomas-mount'));
  for (const day of ['Monday', 'Sunday'] as const) for (const hour of [0, 4, 23]) {
    assert.deepEqual(getRecalculatedTrains(hour, 0, day, guindy, 'Airport'), []);
    assert.match(evaluatePeakStatus(hour, 0, day).peakLabel, /Closed/);
  }
});

test('HTTP errors remain validation/unavailable; only an explicit Closed payload closes service', async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (const status of [400, 422, 500, 503]) {
      globalThis.fetch = async () => new Response(JSON.stringify({ detail: 'test failure' }), { status });
      const result = await fetchMLTrains('Guindy', 'Airport', 9, 0, 'Monday', false, true);
      assert.equal(result.kind, status < 500 ? 'invalid_request' : 'unavailable');
    }
    globalThis.fetch = async () => new Response(JSON.stringify({ trains: [], source: 'gateway_fallback', service_status: 'Available' }));
    assert.equal((await fetchMLTrains('Guindy', 'Airport', 9, 0, 'Monday', false, true)).kind, 'ok');
    globalThis.fetch = async () => new Response(JSON.stringify({ trains: [], source: 'gateway_fallback', service_status: 'Closed' }));
    assert.equal((await fetchMLTrains('Guindy', 'Airport', 23, 0, 'Monday', false, true)).kind, 'closed');
  } finally { globalThis.fetch = originalFetch; }
});

test('latest request wins even when the previous response arrives last', async () => {
  const gate = new LatestRequest();
  let completeOld!: () => void;
  const old = gate.begin();
  let state = '';
  const oldTask = new Promise<void>(resolve => { completeOld = resolve; }).then(() => { if (gate.isCurrent(old)) state = 'old destination'; });
  const latest = gate.begin();
  if (gate.isCurrent(latest)) state = 'latest destination';
  completeOld(); await oldTask;
  assert.equal(state, 'latest destination');
  assert.equal(old.signal.aborted, true);
  gate.cancel(); assert.equal(gate.isCurrent(latest), false);
});

test('partial coach payloads are normalized and fallback confidence is unavailable', () => {
  const original = getSimulationTrains('Guindy', 'Airport', 9, 0, true)[0];
  const result = normalizeTrain({ ...original, crowdBreakdown: { front: 71 } as any, confidenceScore: 94 }, 'gateway_fallback');
  assert.equal(result.crowdBreakdown.front, 71);
  assert.ok(Number.isFinite(result.crowdBreakdown.middle));
  assert.ok(Number.isFinite(result.crowdBreakdown.rear));
  assert.equal(result.confidenceScore, null);
});

test('least crowded option preserves actual category and probability', () => {
  const trains = getSimulationTrains('Guindy', 'Airport', 9, 0, true).map(t => ({ ...t, crowdLevel: 'High' as const, boardingProbability: 50 }));
  const result = computeJourneyOptions(ALL_METRO_STATIONS.find(s => s.id === 'stop-guindy')!, 'Airport', trains, true);
  const option = result.options.find(o => o.type === 'least_crowded')!;
  assert.equal(option.crowdLevel, 'High'); assert.equal(option.boardingProbability, 50);
  assert.deepEqual(computeJourneyOptions(ALL_METRO_STATIONS[0], 'Airport', [], true).options, []);
});

test('closed Smart Coach has no boarding action or arrival timer', () => {
  const html = renderToStaticMarkup(<SmartCoach buses={[]} currentStop={ALL_METRO_STATIONS[0]} profile={INITIAL_PROFILE}
    destination="Airport" telemetrySource="closed" onStartTrip={() => assert.fail('must not board')} />);
  assert.match(html, /Metro service closed/);
  assert.doesNotMatch(html, /coach-accept-board-btn|smartcoach-countdown-display|GPS Active|CMRL-OFF/);
});

test('boarding engine shows returned probability instead of local formula by default', () => {
  const train = { ...getSimulationTrains('Guindy', 'Airport', 17, 0, true)[0], boardingProbability: 41 };
  const html = renderToStaticMarkup(<BoardingProbabilityEngine buses={[train]} currentStop={ALL_METRO_STATIONS[0]}
    profile={INITIAL_PROFILE} activeHours={17} activeMinutes={0} telemetrySource="demo" onSelectBus={() => {}}
    onStartTrip={() => {}} onOpenSmartCoach={() => {}} />);
  assert.match(html, /41<!-- -->%|41%/);
  assert.match(html, /Fallback estimates/);
  assert.doesNotMatch(html, /89\.3%|Scikit-Learn ML Active/);
});

test('bounded fetch aborts a stalled upstream', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => new Promise<Response>((_resolve, reject) => {
    options?.signal?.addEventListener('abort', () => reject(options.signal!.reason), { once: true });
  });
  const keepAlive = setTimeout(() => {}, 100);
  try { await assert.rejects(fetchWithTimeout('http://stalled.test', {}, 15)); }
  finally { clearTimeout(keepAlive); globalThis.fetch = originalFetch; }
});
