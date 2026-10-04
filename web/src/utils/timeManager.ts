import { BusTransit, CrowdDNAPoint, DayPattern, MetroLineType, RouteStop } from '../types';
import { CROWD_DNA_WEEKLY } from '../data/transitData';
import { getSimulationTrains } from './metroNetwork';

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

  if (timeDecimal < 5 || timeDecimal >= 23) {
    return { isPeak: false, peakLabel: 'Metro Closed (05:00 - 23:00)', peakBadgeType: 'night' };
  }

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

/** Route-compatible local estimates when the gateway is unavailable. */
export function getRecalculatedTrains(hours: number, minutes: number, dayName: DayOfWeek,
  currentStop?: RouteStop, destinationName?: string): BusTransit[] {
  try {
    return getSimulationTrains(currentStop?.id || 'stop-guindy', destinationName || 'stop-central',
      hours, minutes, evaluatePeakStatus(hours, minutes, dayName).isPeak);
  } catch { return []; }
}
