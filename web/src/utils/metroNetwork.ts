import network from '../../../data/processed/metro_network.json';
import type { BusTransit } from '../types';

type Line = 'blue' | 'green';
export const stations = network.stations;
export const lines = network.lines;
export const normalizeStation = (value: string) => String(value || '').toLowerCase()
  .replaceAll(' metro station', '').replaceAll(' station', '').replaceAll(' interchange', '')
  .replace(/\s+/g, ' ').trim();

export function resolveStation(query: string) {
  const q = normalizeStation(query);
  if (!q) return undefined;
  return stations.find(s => s.id === query || [s.name, ...s.aliases].some(a => normalizeStation(a) === q));
}

export function planRoute(origin: string, destination: string) {
  const o = resolveStation(origin), d = resolveStation(destination);
  if (!o || !d) throw new Error('Origin and destination must be valid Chennai Metro stations.');
  if (o.id === d.id) return null;
  const choices: { count: number; line: Line; targetId: string; transferId?: string }[] = [];
  for (const line of ['blue', 'green'] as const) {
    const ids = lines[line], oi = ids.indexOf(o.id);
    if (oi < 0) continue;
    if (ids.includes(d.id)) choices.push({ count: Math.abs(oi - ids.indexOf(d.id)), line, targetId: d.id });
    const other = line === 'blue' ? 'green' : 'blue';
    if (!lines[other].includes(d.id)) continue;
    for (const hub of ['stop-central', 'stop-alandur']) {
      if (hub === o.id || hub === d.id) continue;
      choices.push({ count: Math.abs(oi - ids.indexOf(hub)) + Math.abs(lines[other].indexOf(hub) - lines[other].indexOf(d.id)),
        line, targetId: hub, transferId: hub });
    }
  }
  choices.sort((a, b) => a.count - b.count || Number(Boolean(a.transferId)) - Number(Boolean(b.transferId)));
  const choice = choices[0];
  if (!choice) throw new Error('No route serves these stations.');
  const ids = lines[choice.line], oi = ids.indexOf(o.id);
  const southbound = ids.indexOf(choice.targetId) > oi;
  const servedStationIds = southbound ? ids.slice(oi) : ids.slice(0, oi + 1).reverse();
  return { ...choice, originId: o.id, destinationId: d.id,
    direction: southbound ? 'Southbound' : 'Northbound',
    terminusId: servedStationIds.at(-1)!, servedStationIds };
}

export function servesJourney(train: BusTransit, origin: string, destination: string) {
  try {
    const route = planRoute(origin, destination);
    if (!route) return false;
    const served = train.servedStationIds;
    return train.lineColor === route.line && train.serviceDirection === route.direction &&
      Array.isArray(served) && served.indexOf(route.originId) >= 0 &&
      served.indexOf(route.targetId) > served.indexOf(route.originId);
  } catch { return false; }
}

export function getSimulationTrains(origin: string, destination: string, hour: number, minute: number,
  isPeak: boolean, source: 'gateway_fallback' | 'local_demo' = 'local_demo'): BusTransit[] {
  if (hour < 5 || hour >= 23) return [];
  const route = planRoute(origin, destination);
  if (!route) return [];
  const stationName = (id: string) => stations.find(s => s.id === id)!.name;
  const terminus = stationName(route.terminusId), target = stationName(route.targetId);
  const codes = route.line === 'blue'
    ? (route.direction === 'Southbound' ? ['BL-101', 'BL-103'] : ['BL-104', 'BL-112'])
    : (route.direction === 'Southbound' ? ['GL-214', 'GL-216'] : ['GL-201', 'GL-202']);
  return codes.map((code, i) => {
    const density = Math.round((isPeak ? 78 : 32) * (i === 0 ? 1 : 0.8));
    const arrival = (isPeak ? 2 : 4) + i * (isPeak ? 6 : 7);
    const clock = (hour * 60 + minute + arrival) % 1440, h = Math.floor(clock / 60);
    const breakdown = { front: Math.round(density * 0.85), middle: Math.min(99, Math.round(density * 1.12)), rear: Math.round(density * 0.68) };
    return {
      id: 'train-' + code.toLowerCase(), routeNumber: code,
      name: `${route.line === 'blue' ? 'Blue' : 'Green'} Line • ${terminus} (${route.direction})`,
      lineType: route.line === 'blue' ? 'Blue Line' : 'Green Line', lineColor: route.line,
      destination: terminus, currentLocation: `Estimated approach to ${stationName(route.originId)}`,
      nextStop: stationName(route.originId), arrivalMinutes: arrival,
      realArrivalTime: `${String(h % 12 || 12).padStart(2, '0')}:${String(clock % 60).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`,
      boardingProbability: Math.round(100 - density * 0.55), crowdLevel: density < 35 ? 'Low' : density < 70 ? 'Moderate' : 'High',
      capacityPercentage: density, seatsAvailable: Math.max(0, Math.floor((1 - density / 100) * 64)),
      totalCapacity: 240, historicalSuccessRate: 93, confidenceScore: null, source,
      fare: '₹40', acStatus: 'Full AC', doorsCount: 4,
      platformNumber: `Platform ${route.direction === 'Southbound' ? 1 : 2} (${route.direction} towards ${terminus})`,
      wheelchairAccessible: true, crowdBreakdown: breakdown, coachBreakdown: breakdown,
      isRecommended: i === 0, coachReason: `Board ${route.direction} towards ${target}.` +
        (route.transferId ? ` Transfer at ${target} for ${stationName(route.destinationId)}.` : ''),
      serviceDirection: route.direction as 'Southbound' | 'Northbound', servedStationIds: route.servedStationIds,
      firstLegTargetId: route.targetId, terminusId: route.terminusId,
      factors: [{ label: 'Fallback estimate', impact: 'neutral', detail: 'Simulated load; ML inference unavailable.', points: 0 }]
    };
  });
}
