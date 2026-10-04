import express from 'express';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { getSimulationTrains, resolveStation, servesJourney } from './src/utils/metroNetwork';
import { fetchWithTimeout } from './src/utils/fetchWithTimeout';

const app = express();
const PORT = 3000;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

app.use(express.json());

// Background Python ML Service Management
let mlProcess: ChildProcess | null = null;

async function checkMLHealth(): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(`${ML_SERVICE_URL}/api/ml/health`, {}, 1200);
    return res.ok;
  } catch {
    return false;
  }
}

function startMLService() {
  const rootDir = path.resolve(process.cwd(), '..');
  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
  const scriptPath = path.join(rootDir, 'ml_service.py');

  console.log(`[ML Gateway] Spawning Python ML service: ${pythonCmd} ${scriptPath}`);
  try {
    mlProcess = spawn(pythonCmd, [scriptPath], {
      cwd: rootDir,
      stdio: 'inherit',
      detached: false,
    });

    mlProcess.on('error', (err) => {
      console.warn('[ML Gateway] Notice: Could not auto-spawn Python ML process directly:', err.message);
    });

    mlProcess.on('exit', (code) => {
      console.log(`[ML Gateway] Python ML process exited with code ${code}`);
    });
  } catch (err: any) {
    console.warn('[ML Gateway] Error starting Python service:', err.message);
  }
}

// Initialize Google GenAI client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (err) {
      console.warn('Failed to initialize GoogleGenAI client:', err);
    }
  }
  return aiClient;
}

// In-memory feedback store fallback
const feedbackLogs: Array<{
  id: string;
  tripId: string;
  busRoute: string;
  predictedProbability: number;
  actualCrowd: string;
  boardingSucceeded: boolean;
  timestamp: string;
}> = [];

// ==========================================
// API Endpoints
// ==========================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiAvailable: Boolean(process.env.GEMINI_API_KEY),
    feedbackCount: feedbackLogs.length,
  });
});

// ML Health & Metadata Endpoint
app.get('/api/ml/health', async (req, res) => {
  try {
    const response = await fetchWithTimeout(`${ML_SERVICE_URL}/api/ml/health`);
    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    }
  } catch (err: any) {
    // Fallback if ML service is booting or unreachable
  }

  res.json({
    status: 'offline',
    service: 'Chennai Metro ML Gateway',
    model_loaded: false,
    model_type: 'RandomForestClassifier',
    accuracy_score: null,
    classes: ['Green', 'Red', 'Yellow'],
    total_training_samples: 0,
    supported_stations_count: 0,
    note: 'Python ML service unreachable. Operating in gateway fallback mode.',
    timestamp: new Date().toISOString(),
  });
});

// ML Model Retrain Endpoint (Proxied to Python ML service)
app.post('/api/ml/retrain', async (req, res) => {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/api/ml/retrain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    }
    const errData = await response.json().catch(() => ({}));
    return res.status(response.status).json(errData);
  } catch (err: any) {
    console.warn('[ML Gateway] ML /retrain error:', err.message);
    return res.status(503).json({ error: 'ML service offline for retraining' });
  }
});

// ML Crowd Prediction
app.post('/api/ml/predict', async (req, res) => {
  try {
    const response = await fetchWithTimeout(`${ML_SERVICE_URL}/api/ml/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    }
    const errData = await response.json().catch(() => ({}));
    if (response.status < 500) return res.status(response.status).json(errData);
    throw new Error(`ML service returned HTTP ${response.status}`);
  } catch (err: any) {
    console.warn('[ML Gateway] ML /predict fallback:', err.message);
    const { station_name = 'Guindy Metro Station', hour = 9, is_peak_hour = 1 } = req.body;
    const station = resolveStation(station_name);
    if (!station) return res.status(400).json({ detail: 'Invalid station.' });
    if (!Number.isInteger(hour) || hour < 0 || hour > 23 || ![0, 1].includes(is_peak_hour)) {
      return res.status(422).json({ detail: 'Invalid hour or peak flag.' });
    }
    const isPeak = Boolean(is_peak_hour);
    return res.json({
      station_name,
      hour,
      is_peak_hour,
      is_weekend: req.body.is_weekend ?? 0,
      predicted_crowd_class: isPeak ? 'Red' : 'Green',
      crowd_level: isPeak ? 'High' : 'Low',
      probabilities: isPeak ? { Green: 0.05, Yellow: 0.25, Red: 0.7 } : { Green: 0.85, Yellow: 0.12, Red: 0.03 },
      confidence_score: null,
      source: 'gateway_fallback',
      model_loaded: false,
      fallback_reason: 'Python ML service unavailable',
      crowd_density_pct: isPeak ? 82 : 28,
      boarding_probability: isPeak ? 58 : 96,
      seats_available: isPeak ? 12 : 48,
      coach_breakdown: isPeak ? { front: 72, middle: 88, rear: 54 } : { front: 22, middle: 32, rear: 18 },
      crowd_breakdown: isPeak ? { front: 72, middle: 88, rear: 54 } : { front: 22, middle: 32, rear: 18 },
      recommendations: [
        'Fallback estimate based on the selected peak-hour setting; ML inference unavailable.',
        'Coach 4 (Rear DMC2) provides optimal boarding clearance.',
      ],
      model_engine: 'Heuristic fallback',
    });
  }
});

// ML Multi-Train Prediction
app.post('/api/ml/predict-trains', async (req, res) => {
  try {
    const response = await fetchWithTimeout(`${ML_SERVICE_URL}/api/ml/predict-trains`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    }
    if (response.status === 400 || response.status === 422) {
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).json(errData);
    }
  } catch (err: any) {
    console.warn('[ML Gateway] ML /predict-trains fallback:', err.message);
  }

  const origin = resolveStation(req.body.station_name);
  const destination = resolveStation(req.body.destination);
  if (!origin || !destination) {
    return res.status(400).json({ detail: 'Origin and destination must be valid Chennai Metro stations.' });
  }
  if (origin.id === destination.id) {
    return res.status(400).json({ detail: 'Origin and destination are the same station. Choose a different destination.' });
  }
  const hour = Number(req.body.hour ?? 8), minute = Number(req.body.minute ?? 30);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute < 0 || minute > 59 ||
      ![0, 1].includes(req.body.is_peak_hour ?? 1) || ![0, 1].includes(req.body.is_weekend ?? 0)) {
    return res.status(422).json({ detail: 'Invalid time or peak/weekend flag.' });
  }
  const closed = hour < 5 || hour >= 23;
  const trains = getSimulationTrains(origin.id, destination.id, hour, minute, Boolean(req.body.is_peak_hour ?? 1), 'gateway_fallback');
  return res.json({
    station_name: origin.name, destination: destination.name, hour, minute,
    day_of_week: req.body.day_of_week || 'Monday',
    source: 'gateway_fallback', model_loaded: false,
    fallback_reason: 'Python ML inference unavailable', ml_confidence: null,
    service_status: closed ? 'Closed' : 'Available',
    base_crowd_level: closed ? 'Closed' : (req.body.is_peak_hour ? 'High' : 'Low'),
    base_density_pct: closed ? 0 : (req.body.is_peak_hour ? 78 : 32), trains,
    message: closed ? 'Chennai Metro is closed between 23:00 and 05:00.' : 'Showing estimated train and crowd data.'
  });
});

// ML Crowd DNA 24-Hour Curve
app.get('/api/ml/crowd-dna', async (req, res) => {
  const { station_name = 'Guindy Metro Station', day_name = 'Monday' } = req.query;
  try {
    const url = `${ML_SERVICE_URL}/api/ml/crowd-dna?station_name=${encodeURIComponent(String(station_name))}&day_name=${encodeURIComponent(String(day_name))}`;
    const response = await fetchWithTimeout(url);
    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    }
  } catch (err: any) {
    console.warn('[ML Gateway] ML /crowd-dna fallback:', err.message);
  }

  // Fallback 24-hour curve
  const dataPoints = [];
  for (let h = 5; h <= 23; h++) {
    const isPeak = (h >= 8 && h <= 10) || (h >= 17 && h <= 19);
    const crowdPct = isPeak ? 78 : (h >= 12 && h <= 15 ? 32 : 45);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    dataPoints.push({
      timeSlot: `${h12 < 10 ? '0' + h12 : h12}:00 ${period}`,
      hour: h,
      minute: 0,
      crowdPercentage: crowdPct,
      crowdLevel: crowdPct < 40 ? 'Low' : (crowdPct < 70 ? 'Moderate' : 'High'),
      boardingRate: Math.max(40, 100 - crowdPct * 0.6),
      isPeak,
      isBestTime: h === 14,
      recommendedAction: crowdPct < 50 ? 'Optimal Boarding' : 'Board Coach 4 (Rear)',
    });
  }

  res.json({
    station_name,
    day: day_name,
    shortDay: String(day_name).slice(0, 3),
    avgCrowd: 52,
    peakWindow: '08:30 AM - 10:00 AM (84% Peak Surge)',
    bestWindow: '02:00 PM - 04:00 PM (Optimal 28% Load)',
    dataPoints,
  });
});

// Smart Coach AI Route Advisor
app.post('/api/coach/advise', async (req, res) => {
  try {
    const { userQuery, origin, destination, targetArrivalTime, userPreference, persona } = req.body;
    const candidateBuses = (Array.isArray(req.body.candidateBuses) ? req.body.candidateBuses : [])
      .filter((t: any) => servesJourney(t, origin, destination));
    if (!candidateBuses.length) return res.status(400).json({ error: 'No matching trains for this journey.' });

    const mlGrounding = { source: candidateBuses.every((t: any) => t.source === 'ml') ? 'ml' : 'fallback',
      trains: candidateBuses };

    const ai = getAIClient();

    if (ai) {
      const systemInstruction = `You are "CMRL Smart Coach", an intelligent, decisive AI transit copilot for the Chennai Metro Rail Limited (CMRL) network.
Your job is to give clear, actionable, confident recommendations on which Metro train to board, which coach (Coach 4 Rear DMC2 vs Coach 1 Women/Front vs Coach 2/3 Middle) to stand at, and optimal departure windows.
Use only the supplied candidate train values. Data source: ${mlGrounding.source}.
Fallback values are heuristic estimates, not ML inference. Never claim live GPS or guaranteed seats.
Only recommend a routeNumber from the supplied candidates.
Tone: Decisive, helpful, clear, concise, and commuter-centric.
Return valid JSON matching:
{
  "headline": "Short directive",
  "recommendedBusRoute": "BL-104",
  "comparisonDelta": "27% higher boarding probability",
  "detailedReason": "Reason with ML data",
  "actionableSteps": ["Step 1", "Step 2", "Step 3"],
  "alternativeTip": "Alternative advice"
}`;

      const prompt = `Commuter Persona: ${persona || 'Daily Commuter'}
Preference: ${userPreference || 'Highest Boarding Probability'}
Origin: ${origin || 'Guindy Metro Station'}
Destination: ${destination || 'Puratchi Thalaivar Dr. M.G.R Central'}
Target Arrival Time: ${targetArrivalTime || '09:00 AM'}
ML Telemetry: ${JSON.stringify(mlGrounding || {}, null, 2)}
Candidate Trains: ${JSON.stringify(candidateBuses || [], null, 2)}
Provide the best actionable CMRL Smart Coach decision recommendation as strict JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const rawText = response.text || '';
      try {
        const parsed = JSON.parse(rawText);
        if (candidateBuses.some((t: any) => t.routeNumber === parsed.recommendedBusRoute)) {
          return res.json({ success: true, advice: parsed, source: `gemini-2.5-flash+${mlGrounding.source}` });
        }
      } catch (parseError) {
        console.warn('JSON parse fallback for Gemini response:', rawText);
      }
    }

    // Algorithmic Smart Coach Engine grounded in ML outputs
    const ranked = [...candidateBuses].sort((a, b) => b.boardingProbability - a.boardingProbability);
    const bestBus = ranked[0];
    const secondBest = ranked[1];

    const delta = bestBus && secondBest
      ? `${Math.abs(bestBus.boardingProbability - secondBest.boardingProbability)}% higher boarding probability`
      : 'Highest estimated boarding chance';

    const fallbackAdvice = {
      headline: `Consider Chennai Metro ${bestBus.routeNumber} on ${bestBus.platformNumber}`,
      recommendedBusRoute: bestBus.routeNumber,
      comparisonDelta: `${delta} (${mlGrounding.source} estimates)`,
      detailedReason: `Metro Train ${bestBus.routeNumber} has ${bestBus.boardingProbability}% estimated boarding probability and ${bestBus.seatsAvailable} seats estimated available. Seating is not guaranteed.`,
      actionableSteps: [
        `Confirm ${bestBus.platformNumber} on the station display at ${origin}`,
        bestBus.coachReason || 'Check the train direction before boarding',
        'Compare estimated coach loads and follow station coach-position signs',
      ],
      alternativeTip: secondBest
        ? `${secondBest.routeNumber} arrives in approximately ${secondBest.arrivalMinutes} minutes with ${secondBest.boardingProbability}% estimated boarding probability.`
        : 'No alternative matching train is currently available.',
    };

    return res.json({ success: true, advice: fallbackAdvice, source: `smart-coach-engine+${mlGrounding.source}` });
  } catch (error) {
    console.error('Error generating Smart Coach advice:', error);
    res.status(500).json({ error: 'Failed to generate coach advice' });
  }
});

// Trip Feedback & Model Training Ingestion Loop
app.post('/api/trip/submit-feedback', async (req, res) => {
  try {
    const {
      tripId,
      busRoute,
      station_name,
      stationName,
      station,
      predictedProbability,
      actualCrowd,
      boardingSucceeded,
      userWaitMinutes,
      seatSecured,
      comment
    } = req.body;

    const resolvedStation = station_name || stationName || station || 'Guindy Metro Station';

    // Submit to Python ML feedback store
    try {
      const mlFeedbackRes = await fetch(`${ML_SERVICE_URL}/api/ml/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          busRoute,
          station_name: resolvedStation,
          predictedProbability,
          actualCrowd,
          boardingSucceeded,
          userWaitMinutes,
          seatSecured,
          comment,
          timestamp: new Date().toISOString(),
        }),
      });

      if (mlFeedbackRes.ok) {
        const mlResult = await mlFeedbackRes.json();
        return res.json(mlResult);
      } else {
        const errText = await mlFeedbackRes.text();
        let errorDetail = errText;
        try {
          const parsed = JSON.parse(errText);
          errorDetail = parsed.detail || parsed.message || parsed.error || errText;
        } catch (_) {}
        console.warn('[ML Gateway] ML service feedback error:', errorDetail);
        return res.status(mlFeedbackRes.status).json({
          success: false,
          error: `ML Retraining Failed: ${errorDetail}`,
          modelStats: {
            activeLearningWeightsUpdated: false
          }
        });
      }
    } catch (e: any) {
      console.warn('[ML Gateway] Python ML service unreachable for feedback:', e.message);
      return res.status(503).json({
        success: false,
        error: 'ML service is currently offline. Model weights were not updated.',
        modelStats: {
          activeLearningWeightsUpdated: false
        }
      });
    }
  } catch (err: any) {
    console.error('Error processing trip feedback:', err);
    res.status(500).json({ success: false, error: 'Failed to record trip telemetry' });
  }
});

async function start() {
  // Ensure Python ML Service is running
  const isHealthy = await checkMLHealth();
  if (!isHealthy && !process.env.ML_SERVICE_URL) {
    startMLService();
  } else if (isHealthy) {
    console.log(`[ML Gateway] Connected to running Python ML Engine at ${ML_SERVICE_URL}`);
  } else {
    console.warn('[ML Gateway] Configured Python ML service unavailable; using fallback estimates.');
  }

  // Vite dev middleware vs production static files
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Transit Engine Server running on http://0.0.0.0:${PORT}`);
  });
}

export { app };
if (process.env.NODE_ENV !== 'test') start();
