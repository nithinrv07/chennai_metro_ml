import { servesJourney } from '../utils/metroNetwork';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import { LatestRequest } from '../utils/predictionState';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BrainCircuit, Sparkles, CheckCircle2, ArrowRight, 
  Send, Compass, Clock, AlertTriangle, Armchair, 
  Zap, MessageSquare, RefreshCw, Layers, Check, Footprints, Shield,
  TrainFront, CreditCard, Timer, Activity, BellRing, Flame,
  ChevronRight, Info, Gauge, Users, MapPin, TrendingDown,
  Navigation, ShieldAlert, CheckCircle, ExternalLink
} from 'lucide-react';
import { BusTransit, RouteStop, UserProfile, TelemetryDataSource } from '../types';

interface SmartCoachProps {
  telemetrySource?: TelemetryDataSource;
  isLoading?: boolean;
  buses: BusTransit[];
  currentStop: RouteStop;
  profile: UserProfile;
  destination: string;
  onStartTrip: (bus: BusTransit) => void;
  onOpenStationModal?: () => void;
}

interface CoachResponse {
  headline: string;
  recommendedBusRoute: string;
  comparisonDelta: string;
  detailedReason: string;
  actionableSteps: string[];
  alternativeTip?: string;
}

interface SmartAlertItem {
  id: string;
  category: 'carriage' | 'platform' | 'surge' | 'seating';
  severity: 'urgent' | 'recommended' | 'info';
  title: string;
  summary: string;
  details: string;
  recommendedCarriageIndex: number; // 0-based: 0 (Coach 1), 1 (Coach 2), 2 (Coach 3), 3 (Coach 4)
  recommendedZoneName: string;
  doorMarkers: string;
  walkDirections: string;
  crowdDelta: string;
  badge: string;
  timeAgo: string;
}

const SmartCoachContent: React.FC<SmartCoachProps> = ({
  buses,
  currentStop,
  profile,
  destination,
  onStartTrip,
  onOpenStationModal,
  telemetrySource = 'demo',
}) => {
  const [userQuery, setUserQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [selectedAlertCategory, setSelectedAlertCategory] = useState<'all' | 'carriage' | 'platform' | 'surge'>('all');
  const [selectedCoachCar, setSelectedCoachCar] = useState<number>(3); // Default Coach 4 (Rear Car)
  const [appliedZoneFeedback, setAppliedZoneFeedback] = useState<string | null>(null);

  const [advice, setAdvice] = useState<CoachResponse>(() => ({
    headline: `Consider ${buses[0].routeNumber} at ${buses[0].platformNumber}`,
    recommendedBusRoute: buses[0].routeNumber,
    comparisonDelta: 'Based on the available journey estimates',
    detailedReason: buses[0].coachReason || 'Compare arrival and crowd estimates before boarding.',
    actionableSteps: [buses[0].coachReason || 'Check the platform display before boarding.']
  }));
  const [aiSource, setAiSource] = useState<string>('journey-estimate');
  const adviceRequest = useRef(new LatestRequest());
  useEffect(() => () => adviceRequest.current.cancel(), []);
  const recommendedBus = buses.find(b => b.routeNumber === advice.recommendedBusRoute) || buses[0];

  // Countdown timer state for next arriving train (in seconds)
  const [countdownSeconds, setCountdownSeconds] = useState<number>(
    Math.max(0, recommendedBus.arrivalMinutes * 60)
  );

  // Sync initial countdown whenever recommended train changes
  useEffect(() => {
    setCountdownSeconds(Math.max(0, recommendedBus.arrivalMinutes * 60));
  }, [recommendedBus.id, recommendedBus.arrivalMinutes]);

  // Live ticking countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [recommendedBus.arrivalMinutes]);

  const countdownMinutes = Math.floor(countdownSeconds / 60);
  const countdownRemainingSecs = countdownSeconds % 60;
  const totalDuration = Math.max(60, recommendedBus.arrivalMinutes * 60);
  const progressPercent = Math.min(100, Math.max(5, ((totalDuration - countdownSeconds) / totalDuration) * 100));

  // --- SMART ALERTS ENGINE & OCCUPANCY OPTIMIZER ---
  const { smartAlerts, carriagesData, optimalCarriageIndex, platformZones } = useMemo(() => {
    const isHighStationCrowd = currentStop.stationCrowd === 'High' || currentStop.stationCrowd === 'Very High' || currentStop.queueLength > 15;
    const baseBreakdown = recommendedBus.crowdBreakdown || { front: 45, middle: 78, rear: 34 };

    // 4 CMRL standard cars model
    const cars = [
      {
        index: 0,
        coachNumber: 1,
        code: 'DMC1',
        title: 'Coach 1 (Front Car)',
        designation: 'Priority & Special Access Zone',
        loadPercent: baseBreakdown.front,
        seatCount: 12,
        zoneName: 'Platform Zone A (North End)',
        doorMarkers: 'Door #01–04',
        staircaseDistance: 'Walk 35m North of Concourse Stairs',
        isBestAlternative: false,
      },
      {
        index: 1,
        coachNumber: 2,
        code: 'TC1',
        title: 'Coach 2 (Mid-North Car)',
        designation: 'General Trailer Car • Escalator Landing',
        loadPercent: baseBreakdown.middle,
        seatCount: 4,
        zoneName: 'Platform Zone B (Mid-North)',
        doorMarkers: 'Door #05–08',
        staircaseDistance: 'Directly Facing Central Escalator (Chokepoint)',
        isBestAlternative: false,
      },
      {
        index: 2,
        coachNumber: 3,
        code: 'TC2',
        title: 'Coach 3 (Mid-South Car)',
        designation: 'General Trailer Car • Mid Platform',
        loadPercent: baseBreakdown.middle,
        seatCount: 6,
        zoneName: 'Platform Zone C (Mid-South)',
        doorMarkers: 'Door #09–12',
        staircaseDistance: '15m South of Concourse Elevator',
        isBestAlternative: false,
      },
      {
        index: 3,
        coachNumber: 4,
        code: 'DMC2',
        title: 'Coach 4 (Rear Car)',
        designation: 'General Motor Car • Least Congested',
        loadPercent: baseBreakdown.rear,
        seatCount: 18,
        zoneName: 'Platform Zone D (South End)',
        doorMarkers: 'Door #13–16',
        staircaseDistance: 'Walk 28m South towards Rear Screen Doors',
        isBestAlternative: true,
      },
    ];

    // Find the car with the lowest load
    let minLoad = 100;
    let bestIdx = 3;
    cars.forEach((car, i) => {
      if (car.loadPercent < minLoad) {
        minLoad = car.loadPercent;
        bestIdx = i;
      }
    });

    cars.forEach((car, i) => {
      car.isBestAlternative = i === bestIdx;
    });

    const bestCar = cars[bestIdx];
    const congestedCar = cars[1]; // Typically Coach 2 is the bottleneck
    const loadDiff = Math.max(15, congestedCar.loadPercent - bestCar.loadPercent);

    // Generate Contextual Smart Alerts based on current station occupancy
    const estimateSource = recommendedBus.source === 'ml' ? 'ML estimate' : 'Fallback estimate';
    const alerts: SmartAlertItem[] = [{
      id: 'alert-coach-load', category: 'carriage', severity: 'recommended',
      title: `Compare coach loads: ${bestCar.title}`,
      summary: `${bestCar.title} has the lowest estimated load (${bestCar.loadPercent}%) on this train.`,
      details: `${estimateSource}. Coach figures are derived estimates; check the platform display before boarding.`,
      recommendedCarriageIndex: bestIdx, recommendedZoneName: bestCar.zoneName,
      doorMarkers: bestCar.doorMarkers, walkDirections: 'Follow the station coach-position signs.',
      crowdDelta: `${bestCar.loadPercent}% estimated load`, badge: 'Coach estimate', timeAgo: estimateSource
    }, {
      id: 'alert-platform', category: 'platform', severity: 'info',
      title: `Journey platform: ${recommendedBus.platformNumber}`,
      summary: recommendedBus.coachReason || 'Confirm the train direction on the platform display.',
      details: 'Coach zones below are an illustrative layout. Follow station signage for exact boarding positions.',
      recommendedCarriageIndex: bestIdx, recommendedZoneName: bestCar.zoneName,
      doorMarkers: bestCar.doorMarkers, walkDirections: 'Confirm direction and coach position at the station.',
      crowdDelta: 'Check station signs', badge: 'Platform guidance', timeAgo: estimateSource
    }, {
      id: 'alert-seating', category: 'seating', severity: 'info',
      title: 'Seating estimate', summary: `${recommendedBus.seatsAvailable} seats estimated available on this train.`,
      details: 'Seat availability is estimated and can change before arrival; seating is not guaranteed.',
      recommendedCarriageIndex: bestIdx, recommendedZoneName: bestCar.zoneName,
      doorMarkers: bestCar.doorMarkers, walkDirections: 'Compare the next train if comfort is your priority.',
      crowdDelta: `${recommendedBus.boardingProbability}% boarding estimate`, badge: 'Seating estimate', timeAgo: estimateSource
    }];

    // Platform zone map data
    const pZones = [
      {
        id: 'zone-a',
        name: 'Zone A',
        subtext: 'North / Coach 1',
        doors: 'Doors #01–04',
        crowd: cars[0].loadPercent,
        status: cars[0].loadPercent > 70 ? 'Busy' : 'Moderate',
        color: cars[0].loadPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500',
      },
      {
        id: 'zone-b',
        name: 'Zone B',
        subtext: 'Mid-North / Coach 2',
        doors: 'Doors #05–08 (Stairs)',
        crowd: cars[1].loadPercent,
        status: 'Severe Chokepoint',
        color: 'bg-rose-500',
      },
      {
        id: 'zone-c',
        name: 'Zone C',
        subtext: 'Mid-South / Coach 3',
        doors: 'Doors #09–12 (Lift)',
        crowd: cars[2].loadPercent,
        status: cars[2].loadPercent > 70 ? 'Crowded' : 'Moderate',
        color: cars[2].loadPercent > 70 ? 'bg-amber-500' : 'bg-blue-500',
      },
      {
        id: 'zone-d',
        name: 'Zone D',
        subtext: 'South / Coach 4',
        doors: 'Doors #13–16',
        crowd: cars[3].loadPercent,
        status: 'Optimal / Low Crowd',
        color: 'bg-emerald-500',
      },
    ];

    return {
      smartAlerts: alerts,
      carriagesData: cars,
      optimalCarriageIndex: bestIdx,
      platformZones: pZones,
    };
  }, [currentStop, recommendedBus]);

  // Set default selected coach car to the optimal car
  useEffect(() => {
    setSelectedCoachCar(optimalCarriageIndex);
  }, [optimalCarriageIndex]);

  const activeCar = carriagesData[selectedCoachCar] || carriagesData[3];

  const filteredAlerts = useMemo(() => {
    if (selectedAlertCategory === 'all') return smartAlerts;
    return smartAlerts.filter(a => a.category === selectedAlertCategory);
  }, [smartAlerts, selectedAlertCategory]);

  const handleApplyZone = (carIndex: number) => {
    setSelectedCoachCar(carIndex);
    const car = carriagesData[carIndex];
    setAppliedZoneFeedback(`Applied! Staging at ${car.zoneName} (${car.doorMarkers}) for Train ${recommendedBus.routeNumber}`);
    setTimeout(() => setAppliedZoneFeedback(null), 4000);
  };

  const presetQuestions = [
    `I need to reach ${destination} on time from ${currentStop.name.split(' ')[0]}. Which train is safest?`,
    'Should I wait for the next matching train to improve my seating chance?',
    `Which coach door marker at ${currentStop.name.split(' ')[0]} Metro avoids the morning rush choke-point?`,
    'Is it worth interchanging at Alandur or staying on the direct Blue Line?',
  ];

  const fetchCoachAdvice = async (queryText?: string) => {
    const request = adviceRequest.current.begin();
    setIsQuerying(true);
    try {
      const res = await fetchWithTimeout('/api/coach/advise', {
        signal: request.signal,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userQuery: queryText || userQuery || 'Which Chennai Metro train should I board right now?',
          origin: currentStop.name,
          destination,
          targetArrivalTime: '09:00 AM',
          candidateBuses: buses,
          userPreference: profile.preference,
          persona: profile.persona,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (!adviceRequest.current.isCurrent(request)) return;
        if (data.advice && buses.some(b => b.routeNumber === data.advice.recommendedBusRoute)) {
          setAdvice(data.advice);
          setAiSource(data.source || 'gemini-2.5-flash');
        }
      }
    } catch (err) {
      console.warn('Coach advice fetch error:', err);
    } finally {
      if (adviceRequest.current.isCurrent(request)) setIsQuerying(false);
    }
  };

  return (
    <div id="smart-coach-view" className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-blue-50 text-[#0066B2]">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading">
                  Smart Coach Recommendation
                </h2>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Chennai Metro journey assistant: Platform crowd dynamics, door staging, coach car distribution, and Singara NCMC guidance
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-100 text-[#0066B2] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {telemetrySource === 'predicted' ? 'ML estimates' : 'Fallback estimates'}
            </span>
          </div>
        </div>

        {/* Target Context Ribbon */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono">
          <span className="text-slate-400 font-sans font-bold">Route:</span>
          <button
            onClick={onOpenStationModal}
            className="text-slate-900 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 px-2.5 py-1 rounded-lg border border-slate-200 font-bold flex items-center gap-1 transition-colors cursor-pointer"
            title="Click to change departure station"
          >
            <span>{currentStop.name.split(' ')[0]}</span>
            <span className="text-[10px] text-[#0066B2] font-normal underline">change</span>
          </button>
          <span>➔</span>
          <span className="text-slate-900 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 font-bold">
            {destination}
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-[#0066B2] font-bold">Target: 09:00 AM</span>
          <span className="text-slate-300">•</span>
          <span className="text-emerald-600 font-bold capitalize">Priority: {profile.preference.replace('_', ' ')}</span>
        </div>
      </div>

      {/* CORE DECISION CARD (PRIMARY DIRECTIVE - CLEAN LIGHT THEME) */}
      <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden border border-slate-200/90 select-none">
        {/* Top bar & live indicator */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-blue-50 text-[#0066B2]">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <span className="text-sm font-black text-slate-900">
              AI Travel Directive
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-mono text-slate-500">{telemetrySource === 'predicted' ? 'Predicted train data' : 'Simulated train data'}</span>
          </div>
        </div>

        {/* LIVE COUNTDOWN TIMER DISPLAY FOR NEXT TRAIN */}
        <div 
          id="smartcoach-countdown-display"
          className="mb-6 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0066B2] border border-blue-200 flex items-center justify-center shrink-0 shadow-xs">
                <Timer className="w-6 h-6 animate-pulse text-[#0066B2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">
                    Next Train Arrival
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold">
                    ESTIMATE
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  Train <span className="text-[#0066B2] font-mono font-black">{recommendedBus.routeNumber}</span> arriving at <span className="text-emerald-700 font-mono font-black">{recommendedBus.realArrivalTime || 'Live Approaching'}</span> at <strong className="text-slate-900">{currentStop.name.split(' ')[0]}</strong> ({recommendedBus.platformNumber || 'Platform 2'})
                </div>
              </div>
            </div>

            {/* Prominent Countdown Numbers */}
            <div className="text-left sm:text-right bg-white sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border sm:border-0 border-slate-200 shadow-xs sm:shadow-none">
              <div className="text-[10px] text-slate-400 uppercase font-mono font-bold">
                Time Until Arrival
              </div>
              <div className="flex items-baseline gap-1.5 sm:justify-end">
                <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-emerald-600">
                  {countdownMinutes}:{countdownRemainingSecs < 10 ? '0' : ''}{countdownRemainingSecs}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  ({countdownMinutes}m {countdownRemainingSecs}s)
                </span>
              </div>
            </div>
          </div>

          {/* Progress approach bar */}
          <div className="mt-3 pt-3 border-t border-slate-200/80">
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mb-1.5">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-emerald-600" /> Inbound to Platform Screen Doors
              </span>
              <span className="font-bold text-slate-800">{Math.round(progressPercent)}% Inbound Progress</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden p-0.5 border border-slate-300/60">
              <motion.div 
                className="h-full bg-gradient-to-r from-[#0066B2] to-emerald-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
                transition={{ ease: 'linear' }}
              />
            </div>
          </div>
        </div>

        {/* Directive Headline */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-[#0066B2] flex items-center justify-center shrink-0 font-black text-2xl font-mono shadow-xs">
            {advice.recommendedBusRoute}
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight font-heading">
              "{advice.headline}"
            </h3>
            <div className="text-sm font-bold text-emerald-700 mt-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {advice.comparisonDelta}
            </div>
          </div>
        </div>

        {/* Detailed Reason Box */}
        <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 mb-6 space-y-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Why this decision was made:
          </div>
          <p className="text-sm text-slate-700 leading-relaxed font-normal">
            {advice.detailedReason}
          </p>

          {/* Actionable Steps List */}
          <div className="pt-3 border-t border-slate-200 space-y-2.5">
            <div className="text-xs font-bold text-slate-900">Actionable Commute Steps:</div>
            {advice.actionableSteps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 text-xs text-slate-700">
                <span className="w-5 h-5 rounded-full bg-[#0066B2] text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-snug">{step}</span>
              </div>
            ))}
          </div>

          {/* Alternative Tradeoff Tip */}
          {advice.alternativeTip && (
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-2.5 text-xs text-slate-700 mt-2">
              <Armchair className="w-4 h-4 text-[#0066B2] shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block mb-0.5">Comfort / Seating Tip:</strong>
                <span>{advice.alternativeTip}</span>
              </div>
            </div>
          )}
        </div>

        {/* Direct Action Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            id="coach-accept-board-btn"
            onClick={() => onStartTrip(recommendedBus)}
            className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl bg-[#0066B2] hover:bg-blue-600 text-white font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.99] cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-current" />
            Accept Recommendation & Board Train {recommendedBus.routeNumber}
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            id="coach-recalculate-btn"
            onClick={() => fetchCoachAdvice()}
            disabled={isQuerying}
            className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isQuerying ? 'animate-spin' : ''}`} />
            {isQuerying ? 'Analyzing...' : 'Re-Evaluate Journey Options'}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SMART ALERTS: CARRIAGE OCCUPANCY & PLATFORM BOARDING ZONE OPTIMIZER */}
      {/* ========================================================================= */}
      <div 
        id="smartcoach-smart-alerts-feature"
        className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs relative overflow-hidden"
      >
        {/* Header & Alert Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/70 shadow-xs shrink-0">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 font-mono">
                  Estimated Station Occupancy
                </span>
                <span className="text-xs text-slate-400 font-mono">• {currentStop.name.split(' ')[0]}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight font-heading mt-0.5">
                Smart Alerts: Carriage & Boarding Zone Optimizer
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Estimated coach load distribution & platform guidance for Train {recommendedBus.routeNumber}
              </p>
            </div>
          </div>

          {/* Alert Category Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setSelectedAlertCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedAlertCategory === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({smartAlerts.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedAlertCategory('carriage')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedAlertCategory === 'carriage' ? 'bg-[#0066B2] text-white shadow-xs' : 'text-slate-600 hover:text-[#0066B2]'
              }`}
            >
              Carriage
            </button>
            <button
              type="button"
              onClick={() => setSelectedAlertCategory('platform')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedAlertCategory === 'platform' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Platform Zone
            </button>
            <button
              type="button"
              onClick={() => setSelectedAlertCategory('surge')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedAlertCategory === 'surge' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              Surge
            </button>
          </div>
        </div>

        {/* Feedback Banner after applying staging zone */}
        <AnimatePresence>
          {appliedZoneFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between gap-2 shadow-xs"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{appliedZoneFeedback}</span>
              </div>
              <span className="text-[10px] uppercase font-mono text-emerald-600">Updated</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* INTERACTIVE 4-CAR RAKE OCCUPANCY HEATMAP VISUALIZER */}
        {/* ========================================================================= */}
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <TrainFront className="w-4 h-4 text-[#0066B2]" />
              <span className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">
                Train {recommendedBus.routeNumber} Estimated Carriage Occupancy (4 Cars)
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Direction: <strong className="text-slate-700">{recommendedBus.serviceDirection}</strong>
            </div>
          </div>

          {/* 4 Car interactive Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {carriagesData.map((car) => {
              const isSelected = selectedCoachCar === car.index;
              const isOptimal = car.isBestAlternative;
              const isChokepoint = car.loadPercent > 80;

              return (
                <button
                  key={car.code}
                  type="button"
                  onClick={() => setSelectedCoachCar(car.index)}
                  className={`p-3.5 rounded-2xl text-left transition-all relative border cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[#0066B2] ring-2 ring-blue-500/20 shadow-md scale-[1.02]'
                      : 'bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Top Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black font-mono text-xs text-slate-900">
                      {car.code}
                    </span>
                    {isOptimal ? (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                        ★ Best Choice
                      </span>
                    ) : isChokepoint ? (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 uppercase">
                        Chokepoint
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {car.zoneName.split(' ')[1]}
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-bold text-slate-800 truncate mb-1">
                    {car.title}
                  </div>

                  {/* Load Bar & Number */}
                  <div className="space-y-1.5 mt-2">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-500">Crowd Load:</span>
                      <strong className={
                        car.loadPercent >= 80 ? 'text-rose-600 font-black' :
                        car.loadPercent >= 60 ? 'text-amber-600 font-black' : 'text-emerald-600 font-black'
                      }>
                        {car.loadPercent}%
                      </strong>
                    </div>

                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          car.loadPercent >= 80 ? 'bg-rose-500' :
                          car.loadPercent >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${car.loadPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Open Seats & Door Marker */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>Estimated coach load</span>
                    <span className="font-bold text-slate-700">{car.doorMarkers}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Selected Carriage Guidance Details */}
          <div className="mt-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-[#0066B2] text-white text-[10px] font-black uppercase font-mono">
                  {activeCar.title}
                </span>
                <span className="text-xs font-bold text-slate-900">
                  {activeCar.zoneName} ({activeCar.doorMarkers})
                </span>
              </div>
              <div className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                <Footprints className="w-3.5 h-3.5 text-[#0066B2] shrink-0" />
                <span><strong>Walking Guidance:</strong> {activeCar.staircaseDistance}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleApplyZone(selectedCoachCar)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-[#0066B2] text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Select This Carriage Zone
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ACTIVE SMART ALERTS FEED (CARRIAGE, PLATFORM & SURGE ADVICE) */}
        {/* ========================================================================= */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span className="font-bold text-slate-700 uppercase">
              Actionable Station Alerts ({filteredAlerts.length})
            </span>
            <span>Estimated for {currentStop.name.split(' ')[0]}</span>
          </div>

          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                alert.severity === 'urgent'
                  ? 'bg-amber-50/50 border-amber-200/90'
                  : alert.severity === 'recommended'
                  ? 'bg-blue-50/40 border-blue-200/80'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full font-mono ${
                      alert.severity === 'urgent' ? 'bg-amber-500 text-white' :
                      alert.severity === 'recommended' ? 'bg-[#0066B2] text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {alert.badge}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {alert.crowdDelta}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{alert.timeAgo}</span>
                  </div>

                  <h4 className="text-sm sm:text-base font-black text-slate-900">
                    {alert.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {alert.summary}
                  </p>
                  <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-200/60 font-sans">
                    {alert.details}
                  </div>
                </div>

                <div className="sm:text-right shrink-0 pt-1">
                  <button
                    type="button"
                    onClick={() => handleApplyZone(alert.recommendedCarriageIndex)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-slate-900 hover:text-white border border-slate-300 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <span>Go to {alert.doorMarkers}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Platform Boarding Staging Map Legend */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-[#0066B2]" />
            <span>Illustrative Coach Zones:</span>
            <span className="text-slate-700 font-bold">Zone A (Front) • Zone B (Mid-Stairs) • Zone C (Mid-Lift) • Zone D (Rear)</span>
          </div>
          <div className="text-emerald-700 font-bold">
            Recommended Staging: {activeCar.zoneName} ({activeCar.doorMarkers})
          </div>
        </div>
      </div>

      {/* MULTI-TRAIN SIDE-BY-SIDE COMPARISON MATRIX */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs">
        <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#0066B2]" />
          Chennai Metro Estimate Comparison
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {buses.slice(0, 2).map((bus) => {
            const isWinner = bus.routeNumber === advice.recommendedBusRoute;
            return (
              <div
                key={bus.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isWinner
                    ? 'bg-blue-50/40 border-blue-300 ring-1 ring-blue-200'
                    : 'bg-slate-50/80 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-black text-lg text-slate-900">{bus.routeNumber}</span>
                    <span className="text-xs font-semibold text-slate-600">{bus.name}</span>
                  </div>
                  {isWinner ? (
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#0066B2] text-white font-black uppercase tracking-wider">
                      Recommended
                    </span>
                  ) : (
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-200 text-slate-600 font-bold uppercase">
                      Higher Load
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 my-3 text-center">
                  <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-xs">
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Boarding</div>
                    <div className={`text-base font-mono font-black ${isWinner ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {bus.boardingProbability}%
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-xs">
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      {isWinner ? 'Countdown' : 'ETA'}
                    </div>
                    <div className="text-base font-mono font-black text-slate-900">
                      {isWinner ? (
                        <span className="text-emerald-600">
                          {countdownMinutes}:{countdownRemainingSecs < 10 ? '0' : ''}{countdownRemainingSecs}
                        </span>
                      ) : (
                        `${bus.arrivalMinutes}m`
                      )}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-xs">
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Seats</div>
                    <div className="text-base font-mono font-black text-[#0066B2]">
                      {bus.seatsAvailable}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-2 font-medium">
                  {bus.coachReason}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ASK SMART COACH (INTERACTIVE NATURAL LANGUAGE DILEMMA ADVISOR) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#0066B2]" />
          <h3 className="text-sm font-black text-slate-900 font-heading">
            Ask CMRL Coach a Custom Chennai Transit Dilemma
          </h3>
        </div>
        <p className="text-xs text-slate-500 font-medium">
          Travelling with luggage to Airport, heading to TIDEL Park during OMR rush, or interchanging at Alandur? Ask Smart Coach.
        </p>

        {/* Preset Prompt Chips */}
        <div className="flex flex-wrap gap-2">
          {presetQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setUserQuery(q);
                fetchCoachAdvice(q);
              }}
              className="text-xs px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 text-slate-700 text-left transition-all font-medium cursor-pointer active:scale-98"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Custom Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (userQuery.trim()) {
              fetchCoachAdvice(userQuery);
            }
          }}
          className="flex gap-2 pt-2"
        >
          <input
            type="text"
            id="coach-user-input"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="Type your Chennai Metro dilemma or transfer question..."
            className="flex-1 px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
          />
          <button
            type="submit"
            id="coach-submit-query-btn"
            disabled={isQuerying || !userQuery.trim()}
            className="px-6 py-3 rounded-2xl bg-[#0066B2] hover:bg-blue-700 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
          >
            {isQuerying ? 'Analyzing...' : 'Advise Me'}
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};


export const SmartCoach: React.FC<SmartCoachProps> = (props) => {
  const trains = props.buses.filter(t => servesJourney(t, props.currentStop.id, props.destination));
  if (props.isLoading || props.telemetrySource === 'closed' || !trains.length) {
    return <div id="smart-coach-unavailable" className="bg-white border border-slate-200 rounded-3xl p-8 text-center">
      <h2 className="font-bold text-lg">{props.isLoading ? 'Loading journey' : props.telemetrySource === 'closed' ? 'Metro service closed' : 'No matching trains'}</h2>
      <p className="text-sm text-slate-500 mt-2">{props.telemetrySource === 'closed' ? 'Passenger services resume at 05:00 AM.' : 'Select a valid journey or refresh the train estimates.'}</p>
    </div>;
  }
  return <SmartCoachContent key={`${props.currentStop.id}:${props.destination}`} {...props} buses={trains} />;
};
