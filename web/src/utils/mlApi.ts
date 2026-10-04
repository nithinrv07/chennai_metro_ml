/**
 * Chennai Metro ML API Client
 * Provides typed methods to interact with the Scikit-Learn ML backend via Express Gateway
 */

import { BusTransit, DayPattern } from '../types';
import { fetchWithTimeout } from './fetchWithTimeout';
import { normalizeTrain } from './predictionState';

export interface MLHealthResponse {
  status: string;
  service: string;
  model_loaded: boolean;
  model_type: string;
  accuracy_score: number | null;
  classes: string[];
  total_training_samples: number;
  supported_stations_count: number;
  timestamp: string;
}

export interface MLPredictResponse {
  source: 'ml' | 'gateway_fallback';
  model_loaded: boolean;
  fallback_reason?: string;
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
  confidence_score: number | null;
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
  source: 'ml' | 'gateway_fallback';
  model_loaded: boolean;
  fallback_reason?: string;
  station_name: string;
  destination?: string;
  hour: number;
  minute: number;
  day_of_week: string;
  ml_confidence: number | null;
  base_crowd_level: string;
  base_density_pct: number;
  trains: BusTransit[];
  service_status?: string;
  message?: string;
  detail?: string;
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
  station_name?: string;
  stationName?: string;
  predictedProbability?: number;
  actualCrowd?: string;
  boardingSucceeded?: boolean;
  userWaitMinutes?: number;
  seatSecured?: boolean;
  comment?: string;
  timestamp?: string;
}

export interface MLFeedbackResponse {
  success: boolean;
  message?: string;
  error?: string;
  feedback_id?: string;
  modelStats?: {
    totalFeedbackTrained?: number;
    feedbackSamples?: number;
    modelAccuracy?: number;
    activeLearningWeightsUpdated: boolean;
    xpAwarded?: number;
    attributedStation?: string;
  };
}

export async function fetchMLHealth(signal?: AbortSignal): Promise<MLHealthResponse | null> {
  try {
    const res = await fetchWithTimeout('/api/ml/health', { signal });
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
    const res = await fetchWithTimeout('/api/ml/predict', {
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

export type TrainFetchResult =
  | { kind: 'ok'; data: MLPredictTrainsResponse }
  | { kind: 'closed'; data: MLPredictTrainsResponse }
  | { kind: 'invalid_request'; message: string; status?: number }
  | { kind: 'unavailable'; message: string; status?: number };

export async function fetchMLTrains(stationName: string, destination: string, hour: number,
  minute: number, dayOfWeek: string, isWeekend: boolean, isPeak: boolean,
  signal?: AbortSignal): Promise<TrainFetchResult> {
  try {
    const res = await fetchWithTimeout('/api/ml/predict-trains', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal,
      body: JSON.stringify({ station_name: stationName, destination, hour, minute,
        day_of_week: dayOfWeek, is_weekend: Number(isWeekend), is_peak_hour: Number(isPeak) })
    }, 7000);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = typeof data.detail === 'string' ? data.detail : data.error;
      return { kind: [400, 422].includes(res.status) ? 'invalid_request' : 'unavailable',
        status: res.status, message: typeof detail === 'string' ? detail : `Request failed (HTTP ${res.status}).` };
    }
    if (!Array.isArray(data.trains) || !['ml', 'gateway_fallback'].includes(data.source)) {
      return { kind: 'unavailable', message: 'Invalid train response received.' };
    }
    data.trains = data.trains.map((train: BusTransit) => normalizeTrain(train, data.source));
    return { kind: data.service_status === 'Closed' ? 'closed' : 'ok', data };
  } catch (err) {
    if (signal?.aborted) throw err;
    return { kind: 'unavailable', message: 'Train service unavailable. Showing local estimates.' };
  }
}

export async function fetchMLCrowdDNA(
  stationName: string,
  dayName: string
): Promise<MLCrowdDNAResponse | null> {
  try {
    const res = await fetchWithTimeout(
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
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    const errorMsg = data.error || data.detail || `Feedback submission failed (${res.status})`;
    throw new Error(errorMsg);
  }
  return data;
}
