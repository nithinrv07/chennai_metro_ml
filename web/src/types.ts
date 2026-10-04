export type CommuterPersona = 'student' | 'commuter' | 'shift' | 'explorer';

export type PriorityPreference = 'highest_probability' | 'fastest_travel' | 'guaranteed_seat' | 'min_walking';

export type CrowdLevel = 'Low' | 'Moderate' | 'High' | 'Very High' | 'Overflowing';

export type MetroLineType = 'Blue Line' | 'Green Line' | 'Purple Line' | 'Blue / Green Line';

export interface BusTransit {
  id: string;
  routeNumber: string; // e.g. 'BL-104', 'GL-208'
  name: string; // e.g. 'Blue Line • Airport Express'
  lineType?: MetroLineType;
  lineColor?: 'blue' | 'green' | 'purple';
  destination: string;
  currentLocation: string;
  nextStop: string;
  arrivalMinutes: number;
  realArrivalTime?: string; // e.g. '08:28 AM'
  boardingProbability: number; // 0 - 100
  crowdLevel: CrowdLevel;
  capacityPercentage: number; // 0 - 100
  seatsAvailable: number;
  totalCapacity: number;
  historicalSuccessRate: number; // e.g. 91%
  confidenceScore: number | null; // e.g. 96.4%
  source?: 'ml' | 'gateway_fallback' | 'local_demo';
  serviceDirection?: 'Southbound' | 'Northbound';
  servedStationIds?: string[];
  firstLegTargetId?: string;
  terminusId?: string;
  isRecommended?: boolean;
  coachReason?: string;
  coachCoachType?: 'standard' | 'double_decker' | 'electric_rapid' | 'articulated';
  fare: string;
  acStatus: 'Full AC' | 'Standard' | 'Eco Mode' | 'Standby';
  doorsCount: number;
  platformNumber?: string;
  wheelchairAccessible: boolean;
  crowdBreakdown: {
    front: number; // Coach 1 (DMC1 - Women/Front)
    middle: number; // Coach 2 & 3 (TC1 & TC2 - Middle)
    rear: number; // Coach 4 (DMC2 - Rear)
  };
  coachBreakdown?: {
    front: number;
    middle: number;
    rear: number;
  };
  factors: {
    label: string;
    impact: 'positive' | 'neutral' | 'negative';
    detail: string;
    points: number;
  }[];
}

// Alias for semantic clarity
export type MetroTransit = BusTransit;

export interface RouteStop {
  id: string;
  name: string;
  tamilName?: string;
  distanceMeters: number;
  walkMinutes: number;
  stationCrowd: CrowdLevel;
  queueLength: number;
  boardingRateHistorical: number; // %
  busesServing: string[];
  linesServing?: string[];
  interchange?: boolean;
}

export interface CrowdDNAPoint {
  timeSlot: string; // "07:30 AM"
  hour: number;
  minute: number;
  crowdPercentage: number; // 0 - 100
  crowdLevel: CrowdLevel;
  boardingRate: number; // %
  isPeak: boolean;
  isBestTime: boolean;
  recommendedAction?: string;
}

export interface DayPattern {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  shortDay: string;
  avgCrowd: number;
  peakWindow: string;
  bestWindow: string;
  dataPoints: CrowdDNAPoint[];
}

export interface SmartCoachAdvice {
  headline: string;
  recommendedBusId: string;
  comparisonDelta: string;
  detailedReason: string;
  actionableSteps: string[];
  alternativeOption?: {
    busId: string;
    description: string;
    tradeoff: string;
  };
  confidence: number;
}

export interface TripFeedback {
  tripId: string;
  busId: string;
  routeNumber: string;
  predictedProbability: number;
  actualCrowd: CrowdLevel;
  boardingSucceeded: boolean;
  userWaitMinutes: number;
  seatSecured: boolean;
  comment?: string;
  timestamp: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  persona: CommuterPersona;
  preference: PriorityPreference;
  homeStop: string;
  primaryDestination: string;
  xpPoints: number;
  contributionsCount: number;
  accuracyStreak: number;
  notificationsEnabled: boolean;
  gpsEnabled: boolean;
  savedRoutes: string[];
  singaraCardBalance?: string;
}

export type Language = 'en' | 'ta';

export type JourneyOptionType = 'fastest' | 'least_crowded' | 'fewest_transfers';

export type TelemetryDataSource = 'live' | 'predicted' | 'demo' | 'closed';

export interface JourneyOption {
  type: JourneyOptionType;
  title: string;
  tamilTitle: string;
  badge: string;
  durationMinutes: number;
  durationFormatted: string;
  fare: string;
  singaraFare: string;
  stopsCount: number;
  transferCount: number;
  transferStationName?: string;
  transferInstruction?: string;
  train: BusTransit;
  crowdLevel: CrowdLevel;
  boardingProbability: number;
  coachRecommendation: string;
}

