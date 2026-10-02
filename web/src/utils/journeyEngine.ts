import { BusTransit, RouteStop, JourneyOption, Language } from '../types';
import { ALL_METRO_STATIONS, POPULAR_DESTINATIONS } from '../data/transitData';
import { translations } from './translations';

export interface JourneyCalculationResult {
  options: JourneyOption[];
  bestOption: JourneyOption;
  originStation: RouteStop;
  destinationStation: RouteStop | { name: string; tamilName?: string };
  isDirect: boolean;
  estimatedStops: number;
}

// Canonical station lists to determine line membership
const BLUE_LINE_STATION_NAMES = [
  'Wimco Nagar Depot Station',
  'Wimco Nagar Metro Station',
  'Tiruvottriyur Metro Station',
  'Tiruvottriyur Theradi Station',
  'Kaladipet Metro Station',
  'Tollgate Metro Station',
  'New Washermanpet Station',
  'Tondiarpet Metro Station',
  'Sir Theagaraya College Station',
  'Washermanpet Metro Station',
  'Mannadi Metro Station',
  'High Court Metro Station',
  'Puratchi Thalaivar Dr. M.G.R Central',
  'Government Estate Metro Station',
  'LIC Metro Station',
  'Thousand Lights Metro Station',
  'AG-DMS Metro Station',
  'Teynampet Metro Station',
  'Nandanam Metro Station',
  'Saidapet Metro Station',
  'Little Mount Metro Station',
  'Guindy Metro Station',
  'Alandur Interchange Station',
  'Nanganallur Road Station',
  'Meenambakkam Metro Station',
  'Chennai International Airport (MAA)'
];

const GREEN_LINE_STATION_NAMES = [
  'Puratchi Thalaivar Dr. M.G.R Central',
  'Chennai Egmore Metro Station',
  'Nehru Park Metro Station',
  'Kilpauk Medical College Station',
  "Pachaiyappa's College Station",
  'Shenoy Nagar Metro Station',
  'Anna Nagar East Metro Station',
  'Anna Nagar Tower Station',
  'Thirumangalam Metro Station',
  'Koyambedu Metro Station',
  'CMBT Metro Station',
  'Arumbakkam Metro Station',
  'Vadapalani Metro Station',
  'Ashok Nagar Metro Station',
  'Ekkattuthangal Metro Station',
  'Alandur Interchange Station',
  'St. Thomas Mount Metro Station'
];

/**
 * Calculate dynamic travel duration and fare between stations
 */
export function estimateFareAndDuration(fromName: string, toName: string) {
  // Approximate station count
  let stops = 6;
  const fromClean = fromName.toLowerCase();
  const toClean = toName.toLowerCase();

  const isFromBlue = BLUE_LINE_STATION_NAMES.some(s => s.toLowerCase().includes(fromClean) || fromClean.includes(s.toLowerCase().split(' ')[0]));
  const isToBlue = BLUE_LINE_STATION_NAMES.some(s => s.toLowerCase().includes(toClean) || toClean.includes(s.toLowerCase().split(' ')[0]));
  const isFromGreen = GREEN_LINE_STATION_NAMES.some(s => s.toLowerCase().includes(fromClean) || fromClean.includes(s.toLowerCase().split(' ')[0]));
  const isToGreen = GREEN_LINE_STATION_NAMES.some(s => s.toLowerCase().includes(toClean) || toClean.includes(s.toLowerCase().split(' ')[0]));

  const direct = (isFromBlue && isToBlue) || (isFromGreen && isToGreen);

  if (toClean.includes('airport') || fromClean.includes('airport')) {
    stops = 8;
  } else if (toClean.includes('central') || fromClean.includes('central')) {
    stops = direct ? 7 : 11;
  } else if (toClean.includes('egmore') || toClean.includes('koyambedu')) {
    stops = 5;
  } else if (toClean.includes('wimco') || toClean.includes('high court')) {
    stops = 12;
  }

  // Chennai Metro Fare slab: 0-2 km: ₹10, 2-4 km: ₹20, 4-9 km: ₹30, 9-18 km: ₹40, >18 km: ₹50
  let standardFare = 40;
  if (stops <= 3) standardFare = 20;
  else if (stops <= 6) standardFare = 30;
  else if (stops <= 10) standardFare = 40;
  else standardFare = 50;

  const singaraDiscount = Math.round(standardFare * 0.8);

  const durationMin = Math.max(10, Math.round(stops * 2.2 + (direct ? 0 : 5)));

  return {
    stops,
    durationMin,
    standardFare: `₹${standardFare}`,
    singaraFare: `₹${singaraDiscount}`,
    isDirect: direct,
    transferStation: direct ? undefined : (fromClean.includes('airport') || fromClean.includes('guindy') ? 'Alandur Interchange Station' : 'Puratchi Thalaivar Dr. M.G.R Central'),
  };
}

export function computeJourneyOptions(
  originStation: RouteStop,
  destinationName: string,
  buses: BusTransit[],
  isPeak: boolean = false,
  lang: Language = 'en'
): JourneyCalculationResult {
  const t = translations[lang];
  const { stops, durationMin, standardFare, singaraFare, isDirect, transferStation } = estimateFareAndDuration(
    originStation.name,
    destinationName
  );

  const destStop = ALL_METRO_STATIONS.find(s => s.name.toLowerCase() === destinationName.toLowerCase()) || 
                   POPULAR_DESTINATIONS.find(d => d.name.toLowerCase() === destinationName.toLowerCase()) || 
                   { name: destinationName, tamilName: '' };

  const validBuses = buses && buses.length > 0 ? buses : [];
  const primaryTrain = validBuses[0] || {
    id: 'TR-FALLBACK-1',
    routeNumber: 'BL-104',
    name: 'Blue Line Express',
    lineType: 'Blue Line',
    lineColor: 'blue',
    destination: destinationName,
    currentLocation: originStation.name,
    nextStop: 'Next Station',
    arrivalMinutes: 2,
    boardingProbability: isPeak ? 74 : 94,
    crowdLevel: isPeak ? 'Moderate' : 'Low',
    capacityPercentage: isPeak ? 68 : 34,
    seatsAvailable: isPeak ? 18 : 36,
    totalCapacity: 1200,
    historicalSuccessRate: 92,
    confidenceScore: 96,
    fare: standardFare,
    acStatus: 'Full AC',
    doorsCount: 8,
    wheelchairAccessible: true,
    platformNumber: 'Platform 2',
    crowdBreakdown: { front: 40, middle: 70, rear: 32 },
    factors: [],
  };

  // Find least crowded train (highest probability or seats)
  const leastCrowdedTrain = [...validBuses].sort((a, b) => b.boardingProbability - a.boardingProbability)[0] || primaryTrain;

  // Find fastest train (earliest arrival)
  const fastestTrain = [...validBuses].sort((a, b) => a.arrivalMinutes - b.arrivalMinutes)[0] || primaryTrain;

  // 1. FASTEST ROUTE
  const fastestOption: JourneyOption = {
    type: 'fastest',
    title: t.fastestTitle,
    tamilTitle: translations.ta.fastestTitle,
    badge: lang === 'ta' ? 'அதிவேகம்' : 'Fastest Arrival',
    durationMinutes: durationMin,
    durationFormatted: `${durationMin} min`,
    fare: standardFare,
    singaraFare,
    stopsCount: stops,
    transferCount: isDirect ? 0 : 1,
    transferStationName: isDirect ? undefined : transferStation,
    transferInstruction: isDirect 
      ? (lang === 'ta' ? 'நேரடி ரயில் - மாற்றங்கள் இல்லை' : 'Direct Corridor Train (0 transfers)')
      : (lang === 'ta' ? `1 இடமாற்றம் (${transferStation} இல்)` : `1 transfer at ${transferStation}`),
    train: fastestTrain,
    crowdLevel: fastestTrain.crowdLevel,
    boardingProbability: fastestTrain.boardingProbability,
    coachRecommendation: lang === 'ta' ? 'பெட்டி 4 (பின்பகுதி) - விரைவான வெளியேற்றம்' : 'Coach 4 (Rear Car DMC2) for fastest exit',
  };

  // 2. LEAST CROWDED ROUTE
  const leastCrowdDuration = durationMin + (leastCrowdedTrain.id !== fastestTrain.id ? 4 : 0);
  const leastCrowdedOption: JourneyOption = {
    type: 'least_crowded',
    title: t.leastCrowdedTitle,
    tamilTitle: translations.ta.leastCrowdedTitle,
    badge: lang === 'ta' ? 'அதிக இருக்கை வாய்ப்பு' : 'Highest Seating Chance',
    durationMinutes: leastCrowdDuration,
    durationFormatted: `${leastCrowdDuration} min`,
    fare: standardFare,
    singaraFare,
    stopsCount: stops,
    transferCount: isDirect ? 0 : 1,
    transferStationName: isDirect ? undefined : transferStation,
    transferInstruction: isDirect 
      ? (lang === 'ta' ? 'அமைதியான பெட்டி - நேரடி பயணம்' : 'Low density direct rake (0 transfers)')
      : (lang === 'ta' ? `1 இடமாற்றம் (${transferStation} இல்)` : `1 transfer at ${transferStation}`),
    train: leastCrowdedTrain,
    crowdLevel: 'Low',
    boardingProbability: Math.min(99, leastCrowdedTrain.boardingProbability + 6),
    coachRecommendation: lang === 'ta' ? 'பெட்டி 1 (பெண்கள் / முன் பகுதி) அல்லது பெட்டி 4 - 30+ காலி இருக்கைகள்' : 'Coach 1 (Front DMC1) or Coach 4 - 30+ vacant seats',
  };

  // 3. FEWEST TRANSFERS ROUTE
  const fewestTransfersDuration = durationMin + (isDirect ? 0 : 2);
  const fewestTransfersOption: JourneyOption = {
    type: 'fewest_transfers',
    title: t.fewestTransfersTitle,
    tamilTitle: translations.ta.fewestTransfersTitle,
    badge: isDirect ? (lang === 'ta' ? 'நேரடி வழித்தடம்' : 'Direct Service') : (lang === 'ta' ? 'குறைந்த நடைபயிற்சி' : 'Minimum Walking'),
    durationMinutes: fewestTransfersDuration,
    durationFormatted: `${fewestTransfersDuration} min`,
    fare: standardFare,
    singaraFare,
    stopsCount: stops,
    transferCount: isDirect ? 0 : 1,
    transferStationName: isDirect ? undefined : transferStation,
    transferInstruction: isDirect 
      ? (lang === 'ta' ? 'நேரடி மெட்ரோ - ரயில் மாற தேவையில்லை' : 'Direct train — stay on board till destination')
      : (lang === 'ta' ? `தளம் 2 இல் இருந்து எளிதான குறுக்கு நடைபாதை (${transferStation})` : `Cross-platform transfer at ${transferStation}`),
    train: primaryTrain,
    crowdLevel: primaryTrain.crowdLevel,
    boardingProbability: primaryTrain.boardingProbability,
    coachRecommendation: lang === 'ta' ? 'நடு பெட்டிகள் (Coach 2 & 3) - லிஃப்ட் மற்றும் நகரும் படிக்கட்டுக்கு அருகில்' : 'Mid Coaches (TC1/TC2) near escalators & elevator exits',
  };

  const options: JourneyOption[] = [fastestOption, leastCrowdedOption, fewestTransfersOption];

  // Best option is fastest unless crowd is very high
  const bestOption = isPeak ? leastCrowdedOption : fastestOption;

  return {
    options,
    bestOption,
    originStation,
    destinationStation: destStop,
    isDirect,
    estimatedStops: stops,
  };
}
