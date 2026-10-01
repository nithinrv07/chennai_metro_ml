/**
 * Chennai Metro ML API Client
 * Provides typed methods to interact with the Scikit-Learn ML backend via Express Gateway
 */

import { BusTransit, DayPattern } from '../types';

export interface MLHealthResponse {
  status: string;
  service: string;
  model_loaded: boolean;
  model_type: string;
  accuracy_score: number;
  classes: string[];
  total_training_samples: number;
  supported_stations_count: number;
  timestamp: string;
}

export interface MLPredictResponse {
  station_name: string;
  hour: number;
  is_peak_hour: number;
  is_weekend: number;
  predicted_crowd_class: 'Green' | 'Yellow' | 'Red';
  crowd_level: 'Low' | 'Moderate' | 'High' | 'Very High';
  probabilities: {
    Green: number;
    Yellow: number;
    Red: number;
  };
  confidence_score: number;
  crowd_density_pct: number;
  boarding_probability: number;
  seats_available: number;
  coach_breakdown: {
    front: number;
    middle: number;
    rear: number;
  };
  recommendations: string[];
  model_engine: string;
}

export interface MLPredictTrainsResponse {
  station_name: string;
  hour: number;
  minute: number;
  day_of_week: string;
  ml_confidence: number;
  base_crowd_level: string;
  base_density_pct: number;
  trains: BusTransit[];
}

export interface MLCrowdDNAResponse {
  station_name: string;
  day: string;
  shortDay: string;
  avgCrowd: number;
  peakWindow: string;
  bestWindow: string;
  dataPoints: DayPattern['dataPoints'];
}

export interface MLFeedbackPayload {
  tripId?: string;
  busRoute?: string;
  predictedProbability?: number;
  actualCrowd?: string;
  boardingSucceeded?: boolean;
  userWaitMinutes?: number;
  seatSecured?: boolean;
  comment?: string;
}

export interface MLFeedbackResponse {
  success: boolean;
  message: string;
  feedback_id?: string;
  modelStats: {
    totalFeedbackTrained: number;
    modelAccuracy: number;
    activeLearningWeightsUpdated: boolean;
    xpAwarded: number;
  };
}

export async function fetchMLHealth(): Promise<MLHealthResponse | null> {
  try {
    const res = await fetch('/api/ml/health');
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('Could not fetch ML health:', err);
    return null;
  }
}

export async function fetchMLPredict(
  stationName: string,
  hour: number,
  isWeekend: boolean,
  isPeak: boolean
): Promise<MLPredictResponse | null> {
  try {
    const res = await fetch('/api/ml/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        station_name: stationName,
        hour,
        is_weekend: isWeekend ? 1 : 0,
        is_peak_hour: isPeak ? 1 : 0,
      }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('Could not fetch ML crowd prediction:', err);
    return null;
  }
}

export async function fetchMLTrains(
  stationName: string,
  destination: string,
  hour: number,
  minute: number,
  dayOfWeek: string,
  isWeekend: boolean,
  isPeak: boolean
): Promise<MLPredictTrainsResponse | null> {
  try {
    const res = await fetch('/api/ml/predict-trains', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        station_name: stationName,
        destination,
        hour,
        minute,
        day_of_week: dayOfWeek,
        is_weekend: isWeekend ? 1 : 0,
        is_peak_hour: isPeak ? 1 : 0,
      }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('Could not fetch ML train predictions:', err);
    return null;
  }
}

export async function fetchMLCrowdDNA(
  stationName: string,
  dayName: string
): Promise<MLCrowdDNAResponse | null> {
  try {
    const res = await fetch(
      `/api/ml/crowd-dna?station_name=${encodeURIComponent(stationName)}&day_name=${encodeURIComponent(dayName)}`
    );
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('Could not fetch ML Crowd DNA:', err);
    return null;
  }
}

export async function submitTripFeedback(payload: MLFeedbackPayload): Promise<MLFeedbackResponse> {
  const res = await fetch('/api/trip/submit-feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('Failed to submit trip feedback');
  }
  return await res.json();
}
