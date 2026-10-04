import { BusTransit, RouteStop, JourneyOption, Language } from '../types';
import { ALL_METRO_STATIONS, POPULAR_DESTINATIONS } from '../data/transitData';
import { translations } from './translations';
import { calculateCommuterRoute } from './routePlanner';
import { servesJourney } from './metroNetwork';

export interface JourneyCalculationResult {
  options: JourneyOption[];
  bestOption: JourneyOption;
  originStation: RouteStop;
  destinationStation: RouteStop | { name: string; tamilName?: string };
  isDirect: boolean;
  estimatedStops: number;
}

/** Estimates use the same station sequence and interchange as route selection. */
export function estimateFareAndDuration(fromName: string, toName: string) {
  const route = calculateCommuterRoute(fromName, toName);
  return { stops: route.stopCount, durationMin: route.estimatedMinutes,
    standardFare: `₹${route.fareINR}`, singaraFare: `₹${route.fareSingaraINR}`,
    isDirect: route.isDirect, transferStation: route.interchangeStation?.name };
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

  const validBuses = (buses || []).filter(t => servesJourney(t, originStation.id, destinationName));
  if (!validBuses.length) return {
    options: [], bestOption: undefined, originStation, destinationStation: destStop,
    isDirect, estimatedStops: stops
  };
  const primaryTrain = validBuses[0];

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
    crowdLevel: leastCrowdedTrain.crowdLevel,
    boardingProbability: leastCrowdedTrain.boardingProbability,
    coachRecommendation: lang === 'ta' ? 'பெட்டி 1 (பெண்கள் / முன் பகுதி) அல்லது பெட்டி 4 - 30+ காலி இருக்கைகள்' : 'Compare coach occupancy before boarding',
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

