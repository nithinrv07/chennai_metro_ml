/**
 * Chennai Metro Route Planning & Journey Path Engine
 * Computes exact station-by-station travel route, transfers, travel duration, and fares.
 */

import { RouteStop } from '../types';
import { ALL_METRO_STATIONS } from '../data/transitData';

import { lines, resolveStation } from './metroNetwork';

export const BLUE_LINE_STATION_IDS = lines.blue;
export const GREEN_LINE_STATION_IDS = lines.green;

export interface CommuterRoute {
  origin: RouteStop;
  destination: RouteStop;
  stations: RouteStop[];
  stopCount: number;
  estimatedMinutes: number;
  fareINR: number;
  fareSingaraINR: number;
  lineSummary: string;
  isDirect: boolean;
  interchangeStation?: RouteStop;
  directionLabel: string;
  activeStationIds: Set<string>;
}

export function findStationByNameOrId(query: string, allStations: RouteStop[] = ALL_METRO_STATIONS): RouteStop {
  const station = resolveStation(query);
  const result = station && allStations.find(s => s.id === station.id);
  if (!result) throw new Error(`Invalid station: ${query}`);
  return result;
}

export function calculateCommuterRoute(
  originInput: RouteStop | string,
  destinationInput: RouteStop | string,
  allStations: RouteStop[] = ALL_METRO_STATIONS
): CommuterRoute {
  const origin = typeof originInput === 'string' 
    ? findStationByNameOrId(originInput, allStations) 
    : originInput;

  const destination = typeof destinationInput === 'string' 
    ? findStationByNameOrId(destinationInput, allStations) 
    : destinationInput;

  const stationMap = new Map<string, RouteStop>();
  allStations.forEach(s => stationMap.set(s.id, s));

  const blueIdx1 = BLUE_LINE_STATION_IDS.indexOf(origin.id);
  const blueIdx2 = BLUE_LINE_STATION_IDS.indexOf(destination.id);

  const greenIdx1 = GREEN_LINE_STATION_IDS.indexOf(origin.id);
  const greenIdx2 = GREEN_LINE_STATION_IDS.indexOf(destination.id);

  // If origin and destination are the same station
  if (origin.id === destination.id) {
    return {
      origin,
      destination,
      stations: [origin],
      stopCount: 0,
      estimatedMinutes: 0,
      fareINR: 0,
      fareSingaraINR: 0,
      lineSummary: 'Same Station (Select destination)',
      isDirect: true,
      directionLabel: 'Boarding & Destination are identical',
      activeStationIds: new Set<string>([origin.id]),
    };
  }

  let routeStationIds: string[] = [];
  let isDirect = true;
  let interchangeStation: RouteStop | undefined;
  let lineSummary = 'Blue Line Direct';
  let directionLabel = 'Direct Journey';

  // Case 1: Both stations on Blue Line
  if (blueIdx1 !== -1 && blueIdx2 !== -1) {
    isDirect = true;
    lineSummary = 'Blue Line Direct (No transfer)';
    if (blueIdx1 <= blueIdx2) {
      routeStationIds = BLUE_LINE_STATION_IDS.slice(blueIdx1, blueIdx2 + 1);
      directionLabel = 'Southbound towards Airport';
    } else {
      routeStationIds = BLUE_LINE_STATION_IDS.slice(blueIdx2, blueIdx1 + 1).reverse();
      directionLabel = 'Northbound towards Wimco Nagar / Central';
    }
  }
  // Case 2: Both stations on Green Line
  else if (greenIdx1 !== -1 && greenIdx2 !== -1) {
    isDirect = true;
    lineSummary = 'Green Line Direct (No transfer)';
    if (greenIdx1 <= greenIdx2) {
      routeStationIds = GREEN_LINE_STATION_IDS.slice(greenIdx1, greenIdx2 + 1);
      directionLabel = 'Southbound towards St. Thomas Mount';
    } else {
      routeStationIds = GREEN_LINE_STATION_IDS.slice(greenIdx2, greenIdx1 + 1).reverse();
      directionLabel = 'Northbound towards Chennai Central';
    }
  }
  // Case 3: Origin on Blue Line, Destination on Green Line
  else if (blueIdx1 !== -1 && greenIdx2 !== -1) {
    isDirect = false;
    // Choose best interchange between Alandur and Central based on whole-journey stops
    const alandurBlueIdx = BLUE_LINE_STATION_IDS.indexOf('stop-alandur');
    const centralBlueIdx = BLUE_LINE_STATION_IDS.indexOf('stop-central');
    const alandurGreenIdx = GREEN_LINE_STATION_IDS.indexOf('stop-alandur');
    const centralGreenIdx = GREEN_LINE_STATION_IDS.indexOf('stop-central');

    // Route via Alandur
    const seg1Alandur = blueIdx1 <= alandurBlueIdx
      ? BLUE_LINE_STATION_IDS.slice(blueIdx1, alandurBlueIdx + 1)
      : BLUE_LINE_STATION_IDS.slice(alandurBlueIdx, blueIdx1 + 1).reverse();
    const seg2Alandur = alandurGreenIdx <= greenIdx2
      ? GREEN_LINE_STATION_IDS.slice(alandurGreenIdx + 1, greenIdx2 + 1)
      : GREEN_LINE_STATION_IDS.slice(greenIdx2, alandurGreenIdx).reverse();
    const routeAlandur = [...seg1Alandur, ...seg2Alandur];

    // Route via Central
    const seg1Central = blueIdx1 <= centralBlueIdx
      ? BLUE_LINE_STATION_IDS.slice(blueIdx1, centralBlueIdx + 1)
      : BLUE_LINE_STATION_IDS.slice(centralBlueIdx, blueIdx1 + 1).reverse();
    const seg2Central = centralGreenIdx <= greenIdx2
      ? GREEN_LINE_STATION_IDS.slice(centralGreenIdx + 1, greenIdx2 + 1)
      : GREEN_LINE_STATION_IDS.slice(greenIdx2, centralGreenIdx).reverse();
    const routeCentral = [...seg1Central, ...seg2Central];

    const useAlandur = routeAlandur.length < routeCentral.length;
    routeStationIds = useAlandur ? routeAlandur : routeCentral;
    const interchangeId = useAlandur ? 'stop-alandur' : 'stop-central';
    interchangeStation = stationMap.get(interchangeId);

    const interchangeShortName = interchangeStation?.name.includes('Central') ? 'Central' : interchangeStation?.name.split(' ')[0];
    const firstLegDir = useAlandur
      ? (blueIdx1 <= alandurBlueIdx ? 'Southbound to Alandur' : 'Northbound to Alandur')
      : (blueIdx1 <= centralBlueIdx ? 'Southbound to Central' : 'Northbound to Central');
    lineSummary = `Blue Line ➔ Transfer at ${interchangeShortName} ➔ Green Line`;
    directionLabel = `${firstLegDir} (Transfer at ${interchangeShortName})`;
  }
  // Case 4: Origin on Green Line, Destination on Blue Line
  else if (greenIdx1 !== -1 && blueIdx2 !== -1) {
    isDirect = false;
    const alandurGreenIdx = GREEN_LINE_STATION_IDS.indexOf('stop-alandur');
    const centralGreenIdx = GREEN_LINE_STATION_IDS.indexOf('stop-central');
    const alandurBlueIdx = BLUE_LINE_STATION_IDS.indexOf('stop-alandur');
    const centralBlueIdx = BLUE_LINE_STATION_IDS.indexOf('stop-central');

    // Route via Alandur
    const seg1Alandur = greenIdx1 <= alandurGreenIdx
      ? GREEN_LINE_STATION_IDS.slice(greenIdx1, alandurGreenIdx + 1)
      : GREEN_LINE_STATION_IDS.slice(alandurGreenIdx, greenIdx1 + 1).reverse();
    const seg2Alandur = alandurBlueIdx <= blueIdx2
      ? BLUE_LINE_STATION_IDS.slice(alandurBlueIdx + 1, blueIdx2 + 1)
      : BLUE_LINE_STATION_IDS.slice(blueIdx2, alandurBlueIdx).reverse();
    const routeAlandur = [...seg1Alandur, ...seg2Alandur];

    // Route via Central
    const seg1Central = greenIdx1 <= centralGreenIdx
      ? GREEN_LINE_STATION_IDS.slice(greenIdx1, centralGreenIdx + 1)
      : GREEN_LINE_STATION_IDS.slice(centralGreenIdx, greenIdx1 + 1).reverse();
    const seg2Central = centralBlueIdx <= blueIdx2
      ? BLUE_LINE_STATION_IDS.slice(centralBlueIdx + 1, blueIdx2 + 1)
      : BLUE_LINE_STATION_IDS.slice(blueIdx2, centralBlueIdx).reverse();
    const routeCentral = [...seg1Central, ...seg2Central];

    const useAlandur = routeAlandur.length < routeCentral.length;
    routeStationIds = useAlandur ? routeAlandur : routeCentral;
    const interchangeId = useAlandur ? 'stop-alandur' : 'stop-central';
    interchangeStation = stationMap.get(interchangeId);

    const interchangeShortName = interchangeStation?.name.includes('Central') ? 'Central' : interchangeStation?.name.split(' ')[0];
    const firstLegDir = useAlandur
      ? (greenIdx1 <= alandurGreenIdx ? 'Southbound to Alandur' : 'Northbound to Alandur')
      : (greenIdx1 <= centralGreenIdx ? 'Southbound to Central' : 'Northbound to Central');
    lineSummary = `Green Line ➔ Transfer at ${interchangeShortName} ➔ Blue Line`;
    directionLabel = `${firstLegDir} (Transfer at ${interchangeShortName})`;
  }
  // Fallback: Default directly to slice between origin and dest
  else {
    routeStationIds = [origin.id, destination.id];
  }

  const stations: RouteStop[] = routeStationIds
    .map(id => stationMap.get(id))
    .filter((s): s is RouteStop => Boolean(s));

  const stopCount = Math.max(1, stations.length - 1);
  const estimatedMinutes = stopCount * 2 + (isDirect ? 0 : 5);
  
  // Standard CMRL slab calculation: 0-2km: 10, 2-5km: 20, 5-10km: 30, 10-15km: 40, 15km+: 50
  const fareINR = Math.min(50, Math.max(10, Math.ceil(stopCount / 3) * 10));
  const fareSingaraINR = Math.round(fareINR * 0.8);

  const activeStationIds = new Set<string>(routeStationIds);

  return {
    origin,
    destination,
    stations,
    stopCount,
    estimatedMinutes,
    fareINR,
    fareSingaraINR,
    lineSummary,
    isDirect,
    interchangeStation,
    directionLabel,
    activeStationIds,
  };
}

