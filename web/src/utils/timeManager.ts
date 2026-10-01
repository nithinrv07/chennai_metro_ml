import { BusTransit, CrowdDNAPoint, DayPattern, MetroLineType, RouteStop } from '../types';
import { INITIAL_BUSES, CROWD_DNA_WEEKLY } from '../data/transitData';

export type TimeMode = 'live' | 'rush_morning' | 'optimal_morning' | 'afternoon_calm' | 'rush_evening' | 'night_shift' | 'custom';

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface TimeState {
  mode: TimeMode;
  date: Date;
  formattedTime: string;       // e.g. "08:26 AM"
  formattedWithSeconds: string; // e.g. "08:26:14 AM"
  dayName: DayOfWeek;
  dayShort: string;            // e.g. "Mon"
  hours: number;               // 0 - 23
  minutes: number;             // 0 - 59
  seconds: number;             // 0 - 59
  isPeak: boolean;
  peakLabel: string;
  peakBadgeType: 'peak' | 'optimal' | 'moderate' | 'night';
}

export const TIME_PRESETS: {
  id: TimeMode;
  label: string;
  sublabel: string;
  timeStr: string;
  hours: number;
  minutes: number;
  iconType: 'morning' | 'optimal' | 'afternoon' | 'evening' | 'night';
}[] = [
  {
    id: 'rush_morning',
    label: 'Morning Rush Peak',
    sublabel: 'Anna Salai & Guindy Choke-Point',
    timeStr: '08:30 AM',
    hours: 8,
    minutes: 30,
    iconType: 'morning',
  },
  {
    id: 'optimal_morning',
    label: 'Morning Optimal Window',
    sublabel: '97% Clearance & Guaranteed Seats',
    timeStr: '09:15 AM',
    hours: 9,
    minutes: 15,
    iconType: 'optimal',
  },
  {
    id: 'afternoon_calm',
    label: 'Afternoon Quiet',
    sublabel: 'Low platform load & open coaches',
    timeStr: '02:30 PM',
    hours: 14,
    minutes: 30,
    iconType: 'afternoon',
  },
  {
    id: 'rush_evening',
    label: 'Evening IT Return Rush',
    sublabel: 'OMR & Chennai Central Commuter Peak',
    timeStr: '06:15 PM',
    hours: 18,
    minutes: 15,
    iconType: 'evening',
  },
  {
    id: 'night_shift',
    label: 'Late Night Transit',
    sublabel: 'Airport connection & quiet rakes',
    timeStr: '10:00 PM',
    hours: 22,
    minutes: 0,
    iconType: 'night',
  },
];

export function formatTime12h(hours: number, minutes: number, seconds?: number): string {
  const period = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 === 0 ? 12 : hours % 12;
  const m = minutes < 10 ? `0${minutes}` : `${minutes}`;
  if (seconds !== undefined) {
    const s = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return `${h < 10 ? `0${h}` : h}:${m}:${s} ${period}`;
  }
  return `${h < 10 ? `0${h}` : h}:${m} ${period}`;
}

/**
 * Calculates the exact clock arrival time given base clock and ETA minutes.
 */
export function computeRealArrivalTime(hours: number, minutes: number, arrivalMinutes: number, seconds?: number): string {
  const totalMinutes = (hours * 60 + minutes + arrivalMinutes) % (24 * 60);
  const arrHours = Math.floor(totalMinutes / 60);
  const arrMinutes = totalMinutes % 60;
  return formatTime12h(arrHours, arrMinutes, seconds);
}

export function getDayName(dayIndex: number): DayOfWeek {
  const days: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex % 7];
}

export function evaluatePeakStatus(hours: number, minutes: number, dayName: DayOfWeek): {
  isPeak: boolean;
  peakLabel: string;
  peakBadgeType: 'peak' | 'optimal' | 'moderate' | 'night';
} {
  const timeDecimal = hours + minutes / 60;
  const isWeekend = dayName === 'Saturday' || dayName === 'Sunday';

  if (isWeekend) {
    if (timeDecimal >= 12.5 && timeDecimal <= 16.0) {
      return { isPeak: true, peakLabel: 'Weekend Mall & Marina Peak', peakBadgeType: 'peak' };
    }
    if (timeDecimal >= 7.0 && timeDecimal <= 12.0) {
      return { isPeak: false, peakLabel: 'Weekend Morning Leisure', peakBadgeType: 'optimal' };
    }
    return { isPeak: false, peakLabel: 'Moderate Weekend Load', peakBadgeType: 'moderate' };
  }

  // Weekday logic (Monday - Friday)
  if (timeDecimal >= 8.0 && timeDecimal <= 10.5) {
    if (timeDecimal >= 8.25 && timeDecimal <= 9.0) {
      return { isPeak: true, peakLabel: 'Anna Salai Morning Surge', peakBadgeType: 'peak' };
    }
    return { isPeak: true, peakLabel: 'Morning Office Peak', peakBadgeType: 'peak' };
  }

  if (timeDecimal > 9.0 && timeDecimal <= 11.5) {
    return { isPeak: false, peakLabel: 'Optimal Boarding Window', peakBadgeType: 'optimal' };
  }

  if (timeDecimal >= 17.0 && timeDecimal <= 20.0) {
    if (timeDecimal >= 17.75 && timeDecimal <= 19.25) {
      return { isPeak: true, peakLabel: 'Evening OMR Return Surge', peakBadgeType: 'peak' };
    }
    return { isPeak: true, peakLabel: 'Evening Rush Hour', peakBadgeType: 'peak' };
  }

  if (timeDecimal >= 21.5 || timeDecimal < 6.0) {
    return { isPeak: false, peakLabel: 'Late Night / Early Rake', peakBadgeType: 'night' };
  }

  return { isPeak: false, peakLabel: 'Afternoon Low Load', peakBadgeType: 'optimal' };
}

/**
 * Dynamically adjust trains according to active time, day & current station
 */
export function getRecalculatedTrains(
  hours: number, 
  minutes: number, 
  dayName: DayOfWeek,
  currentStop?: RouteStop
): BusTransit[] {
  const { isPeak, peakBadgeType } = evaluatePeakStatus(hours, minutes, dayName);
  const stationName = currentStop?.name || 'Guindy Metro Station';
  const stationQueue = currentStop?.queueLength || 12;
  const stationBoardingRate = currentStop?.boardingRateHistorical || 91;

  return INITIAL_BUSES.map((bus) => {
    let cap = bus.capacityPercentage;
    let prob = bus.boardingProbability;
    let seats = bus.seatsAvailable;
    let crowd: 'Low' | 'Moderate' | 'High' | 'Very High' | 'Overflowing' = bus.crowdLevel;
    let eta = bus.arrivalMinutes;
    const breakdown = bus.crowdBreakdown || (bus as any).coachBreakdown || { front: 45, middle: 75, rear: 35 };
    let front = breakdown.front;
    let middle = breakdown.middle;
    let rear = breakdown.rear;

    if (bus.id === 'train-bl-104') {
      if (isPeak) {
        cap = 76;
        prob = Math.min(95, Math.max(50, Math.round(stationBoardingRate * 0.95)));
        seats = 22;
        crowd = 'Moderate';
        eta = 2;
        front = 72;
        middle = 86;
        rear = 48;
      } else if (peakBadgeType === 'optimal') {
        cap = 35;
        prob = Math.min(99, Math.max(80, Math.round(stationBoardingRate * 1.05)));
        seats = 48;
        crowd = 'Low';
        eta = 4;
        front = 25;
        middle = 42;
        rear = 20;
      } else if (peakBadgeType === 'night') {
        cap = 18;
        prob = 99;
        seats = 65;
        crowd = 'Low';
        eta = 8;
        front = 12;
        middle = 20;
        rear = 15;
      } else {
        cap = 28;
        prob = 98;
        seats = 56;
        crowd = 'Low';
        eta = 5;
        front = 20;
        middle = 32;
        rear = 18;
      }
    } else if (bus.id === 'train-gl-208') {
      if (isPeak) {
        cap = 88;
        prob = Math.min(85, Math.max(45, Math.round(stationBoardingRate * 0.72)));
        seats = 6;
        crowd = 'High';
        eta = 6;
        front = 92;
        middle = 96;
        rear = 78;
      } else if (peakBadgeType === 'optimal') {
        cap = 42;
        prob = Math.min(96, Math.max(75, Math.round(stationBoardingRate * 1.02)));
        seats = 38;
        crowd = 'Low';
        eta = 7;
        front = 35;
        middle = 50;
        rear = 30;
      } else if (peakBadgeType === 'night') {
        cap = 15;
        prob = 99;
        seats = 70;
        crowd = 'Low';
        eta = 12;
        front = 10;
        middle = 16;
        rear = 12;
      } else {
        cap = 32;
        prob = 96;
        seats = 48;
        crowd = 'Low';
        eta = 8;
        front = 25;
        middle = 38;
        rear = 24;
      }
    } else if (bus.id === 'train-bl-112') {
      if (isPeak) {
        cap = 45;
        prob = Math.min(98, Math.max(65, Math.round(stationBoardingRate * 1.02)));
        seats = 42;
        crowd = 'Low';
        eta = 9;
        front = 35;
        middle = 48;
        rear = 32;
      } else if (peakBadgeType === 'optimal') {
        cap = 22;
        prob = 99;
        seats = 58;
        crowd = 'Low';
        eta = 11;
        front = 18;
        middle = 25;
        rear = 18;
      } else {
        cap = 16;
        prob = 99;
        seats = 68;
        crowd = 'Low';
        eta = 14;
        front = 12;
        middle = 18;
        rear = 14;
      }
    }

    const updatedFactors = [
      { label: 'Train Capacity', impact: cap > 75 ? 'negative' : 'positive', detail: `${seats} unallocated seats (${cap}% load)`, points: cap > 75 ? -15 : +22 },
      { label: 'Platform Clearance', impact: 'positive', detail: `${stationBoardingRate}% clearance at ${stationName.replace(' Metro Station', '').replace(' Station', '')}`, points: Math.round(stationBoardingRate * 0.28) },
      { label: '4-Car Dual Door Loading', impact: 'positive', detail: '8 wide automatic doors open simultaneously', points: +14 },
      { label: 'Station Queue', impact: stationQueue > 20 ? 'negative' : 'neutral', detail: `${stationQueue} commuters queued at platform`, points: stationQueue > 20 ? -12 : -4 },
      { label: 'Interchange Flow', impact: 'positive', detail: 'Steady passenger circulation & alighting', points: +12 },
    ] as any;

    return {
      ...bus,
      nextStop: stationName,
      capacityPercentage: cap,
      boardingProbability: prob,
      seatsAvailable: seats,
      crowdLevel: crowd,
      arrivalMinutes: eta,
      realArrivalTime: computeRealArrivalTime(hours, minutes, eta),
      crowdBreakdown: { front, middle, rear },
      coachBreakdown: { front, middle, rear },
      factors: updatedFactors,
    };
  });
}
