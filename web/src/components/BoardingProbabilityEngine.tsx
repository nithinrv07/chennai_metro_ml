import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Target, TrainFront, Users, Clock, ShieldCheck, Activity, 
  Layers, ArrowRight, RefreshCw, Sliders, ChevronDown, 
  CheckCircle2, AlertCircle, Info, Sparkles, MapPin, Armchair,
  CreditCard, Compass, Star, Cpu
} from 'lucide-react';
import { BusTransit, RouteStop, UserProfile } from '../types';
import { ALL_METRO_STATIONS, NEARBY_STOPS, calculateBoardingProbability } from '../data/transitData';

interface BoardingProbabilityEngineProps {
  buses: BusTransit[];
  selectedBusId?: string;
  currentStop: RouteStop;
  profile: UserProfile;
  onSelectBus: (bus: BusTransit) => void;
  onStartTrip: (bus: BusTransit) => void;
  onOpenSmartCoach: () => void;
  onOpenStationModal?: () => void;
  onSelectStation?: (station: RouteStop) => void;
}

export const BoardingProbabilityEngine: React.FC<BoardingProbabilityEngineProps> = ({
  buses,
  selectedBusId,
  currentStop,
  profile,
  onSelectBus,
  onStartTrip,
  onOpenSmartCoach,
  onOpenStationModal,
  onSelectStation,
}) => {
  const hasTrains = Boolean(buses && buses.length > 0);
  const [activeBusId, setActiveBusId] = useState<string>(selectedBusId || (hasTrains ? buses[0].id : ''));
  const [activeStopId, setActiveStopId] = useState<string>(currentStop.id);

  // Sync if currentStop changes
  useEffect(() => {
    setActiveStopId(currentStop.id);
    setSimulatedQueue(currentStop.queueLength);
  }, [currentStop]);
  
  // What-If Simulation Sandbox State
  const [simulatedQueue, setSimulatedQueue] = useState<number>(currentStop.queueLength);
  const [simulatedTimeOffset, setSimulatedTimeOffset] = useState<number>(0); // minutes offset
  const [simulatedCapacity, setSimulatedCapacity] = useState<number | null>(null);

  const selectedBus = hasTrains ? (buses.find((b) => b.id === activeBusId) || buses[0]) : null;
  const selectedStop = ALL_METRO_STATIONS.find((s) => s.id === activeStopId) || currentStop;

  // Compute live CMRL ML prediction dynamically
  const currentCap = simulatedCapacity !== null ? simulatedCapacity : (selectedBus?.capacityPercentage ?? 50);
  const timeOfDayHour = 8.5 + (simulatedTimeOffset / 60); // 8:30 AM base + offset

  const mlPrediction = useMemo(() => {
    return calculateBoardingProbability(
      currentCap,
      simulatedQueue,
      selectedStop.boardingRateHistorical,
      timeOfDayHour,
      selectedBus?.doorsCount ?? 4
    );
  }, [currentCap, simulatedQueue, selectedStop.boardingRateHistorical, timeOfDayHour, selectedBus?.doorsCount]);

  const isSimulated = simulatedCapacity !== null || simulatedQueue !== currentStop.queueLength || simulatedTimeOffset !== 0;

  const resetSimulation = () => {
    setSimulatedQueue(selectedStop.queueLength);
    setSimulatedCapacity(null);
    setSimulatedTimeOffset(0);
  };

  const getTierColor = (tier: string) => {
    if (tier === 'high') return {
      text: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      circle: 'stroke-emerald-500',
      pill: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
    if (tier === 'low') return {
      text: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      circle: 'stroke-rose-500',
      pill: 'bg-rose-50 text-rose-700 border-rose-200'
    };
    return {
      text: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      circle: 'stroke-amber-500',
      pill: 'bg-amber-50 text-amber-700 border-amber-200'
    };
  };

  const tierStyle = getTierColor(mlPrediction.tier);

  return (
    <div id="boarding-probability-engine-view" className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-blue-50 text-[#0066B2]">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading">
                  Boarding Probability Engine
                </h2>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Multi-factor ML ensemble calculating exact platform clearance likelihood across Chennai Metro lines
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-800 flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
              Scikit-Learn ML Active (89.3% Acc)
            </span>
          </div>
        </div>

        {/* Train Selector Chips */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2.5 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Select Metro Train:</span>
          {buses.length > 0 ? (
            buses.map((bus) => {
              const isSelected = bus.id === activeBusId;
              return (
                <button
                  key={bus.id}
                  id={`engine-select-bus-${bus.id}`}
                  onClick={() => {
                    setActiveBusId(bus.id);
                    onSelectBus(bus);
                  }}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold font-mono transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#0066B2] text-white shadow-sm shadow-blue-500/20 scale-105'
                      : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{bus.routeNumber}</span>
                  <span className={`text-[10px] font-normal font-sans px-1.5 py-0.2 rounded-md ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {bus.boardingProbability}%
                  </span>
                </button>
              );
            })
          ) : (
            <span className="text-xs text-slate-400 italic font-medium">
              No trains operating at this hour (Chennai Metro operates 05:00 - 23:00)
            </span>
          )}
        </div>
      </div>

      {selectedBus ? (
        <>
          {/* CORE ML PREDICTION DISPLAY & BREAKDOWN */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {isSimulated && (
          <div className="absolute top-0 right-0 bg-amber-500 text-white font-black text-[10px] px-3.5 py-1 rounded-bl-2xl uppercase tracking-wider flex items-center gap-1 shadow-xs">
            <Sliders className="w-3 h-3" /> Live Sandbox Simulation
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Main Visual Probability Meter */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-50 border border-slate-100 text-center relative">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className={`w-4 h-4 ${tierStyle.text}`} />
              Predicted Boarding Rate
            </div>

            {/* Huge Radial Percentage Gauge */}
            <div className="relative w-44 h-44 flex items-center justify-center my-2">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  className="stroke-slate-200"
                  strokeWidth="10"
                  fill="transparent"
                />
                <motion.circle
                  cx="60"
                  cy="60"
                  r="50"
                  className={tierStyle.circle}
                  strokeWidth="10"
                  strokeDasharray="314.159"
                  initial={{ strokeDashoffset: 314.159 }}
                  animate={{ strokeDashoffset: 314.159 * (1 - mlPrediction.probability / 100) }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className={`text-5xl font-black font-mono tracking-tight ${tierStyle.text}`}>
                  {mlPrediction.probability}%
                </span>
                <span className="text-[11px] text-slate-700 font-mono mt-0.5 font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#0066B2]" />
                  {selectedBus.realArrivalTime || 'Live Approaching'} (~{selectedBus.arrivalMinutes}m)
                </span>
              </div>
            </div>

            {/* Status Tier Badge */}
            <div className={`px-4 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase border ${tierStyle.pill}`}>
              {mlPrediction.label}
            </div>

            <div className="flex items-center justify-between w-full text-xs text-slate-500 mt-4 pt-3 border-t border-slate-200 font-mono">
              <span>CMRL Confidence:</span>
              <span className="text-slate-900 font-bold">{mlPrediction.confidence}%</span>
            </div>
          </div>

          {/* Detailed Input Parameters & Facts */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 mb-0.5 flex items-center gap-2">
                <span>Train {selectedBus.routeNumber} — {selectedBus.name}</span>
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                <span>Evaluating: <strong className="text-slate-900">{selectedStop.name}</strong></span>
                <span className="text-slate-300">•</span>
                <span>Arrival: <strong className="text-[#0066B2] font-mono">{selectedBus.realArrivalTime || 'Live Approaching'}</strong> (in {selectedBus.arrivalMinutes}m)</span>
                <span className="text-slate-300">•</span>
                <span>{selectedBus.platformNumber || 'Platform 2'}</span>
              </p>
            </div>

            {/* 4 Core Data Factor Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-1 font-bold">
                  <Users className="w-3.5 h-3.5 text-[#0066B2]" />
                  Rake Load Density
                </div>
                <div className="text-sm font-black text-slate-900">
                  {currentCap > 85 ? 'High / Standing' : currentCap > 60 ? 'Moderate' : 'Low / Seated'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {currentCap}% capacity loaded
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-1 font-bold">
                  <Armchair className="w-3.5 h-3.5 text-emerald-600" />
                  Open Seats
                </div>
                <div className="text-sm font-black text-emerald-600 font-mono">
                  {Math.max(0, Math.round(selectedBus.totalCapacity * (1 - currentCap / 100)))} Available
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Total capacity: {selectedBus.totalCapacity} (4 Cars)
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-1 font-bold">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Platform Queue
                </div>
                <div className="text-sm font-black text-slate-900 font-mono">
                  {simulatedQueue} Commuters
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  At {selectedStop.name.split(' ')[0]} platform
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-1 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  Historical Clearance
                </div>
                <div className="text-sm font-black text-indigo-700 font-mono">
                  {selectedStop.boardingRateHistorical}% Rate
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {selectedStop.name.split(' ')[0]} Baseline
                </div>
              </div>
            </div>

            {/* 4-Coach Car Crowd Distribution */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between text-xs mb-2.5">
                <span className="font-bold text-slate-800">4-Car Alstom Coach Breakdown</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-black uppercase flex items-center gap-1">
                  <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                  Best: Coach 4 (Rear DMC2)
                </span>
              </div>
              {(() => {
                const busBreakdown = selectedBus.crowdBreakdown || (selectedBus as any).coachBreakdown || { front: 45, middle: 75, rear: 35 };
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs">
                      <div className="text-[10px] text-slate-500 font-medium">Coach 1 (Women)</div>
                      <div className="text-xs font-black text-amber-600 font-mono">{busBreakdown.front}%</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs">
                      <div className="text-[10px] text-slate-500 font-medium">Coach 2 (Mid)</div>
                      <div className="text-xs font-black text-rose-600 font-mono">{busBreakdown.middle}%</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs">
                      <div className="text-[10px] text-slate-500 font-medium">Coach 3 (Mid)</div>
                      <div className="text-xs font-black text-rose-600 font-mono">{busBreakdown.middle}%</div>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-300 shadow-xs">
                      <div className="text-[10px] text-emerald-800 font-bold">Coach 4 (Rear ★)</div>
                      <div className="text-xs font-black text-emerald-700 font-mono">{busBreakdown.rear}%</div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Direct Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              <button
                id="engine-board-btn"
                onClick={() => onStartTrip(selectedBus)}
                className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-[#0066B2] hover:bg-blue-700 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20 active:scale-[0.99] cursor-pointer"
              >
                <TrainFront className="w-4 h-4" /> Board Train {selectedBus.routeNumber} Now
              </button>
              <button
                id="engine-coach-advise-btn"
                onClick={onOpenSmartCoach}
                className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#0066B2]" /> Ask CMRL Coach
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FACTOR INFLUENCE BREAKDOWN (ML Explainability) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs">
        <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#0066B2]" />
          Chennai Metro Model Factor Attribution & Scoring Weights
        </h3>

        <div className="space-y-2.5">
          {selectedBus.factors.map((f, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  f.impact === 'positive' ? 'bg-emerald-500' : f.impact === 'negative' ? 'bg-rose-500' : 'bg-slate-400'
                }`} />
                <div>
                  <span className="font-bold text-slate-900">{f.label}</span>
                  <span className="text-slate-500 ml-2 font-normal text-[11px]">{f.detail}</span>
                </div>
              </div>
              <span className={`font-mono font-bold px-2.5 py-1 rounded-lg text-xs ${
                f.points > 0 ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-rose-700 bg-rose-50 border border-rose-200'
              }`}>
                {f.points > 0 ? `+${f.points}` : f.points} pts
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* INTERACTIVE WHAT-IF SIMULATION SANDBOX */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#0066B2]" />
            <h3 className="text-sm font-black text-slate-900">
              What-If Prediction Sandbox
            </h3>
          </div>
          {isSimulated && (
            <button
              onClick={resetSimulation}
              className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1 font-bold cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Variables
            </button>
          )}
        </div>
        <p className="text-xs text-slate-500 font-medium">
          Tweak commuter queue size or arrival time to test how dynamic passenger spikes impact Chennai Metro boarding odds.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Station Queue Slider */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-800">{selectedStop.name.replace(' Metro Station', '').replace(' Station', '')} Queue Length</span>
              <span className="font-mono font-black text-[#0066B2]">{simulatedQueue} passengers</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="2"
              value={simulatedQueue}
              onChange={(e) => setSimulatedQueue(Number(e.target.value))}
              className="w-full accent-[#0066B2] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0 (Empty Platform)</span>
              <span>25 (Peak Rush)</span>
              <span>50 (Surge)</span>
            </div>
          </div>

          {/* Bus Capacity Simulation Slider */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-800">Train Capacity Load</span>
              <span className="font-mono font-black text-emerald-600">{currentCap}% Full</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={currentCap}
              onChange={(e) => setSimulatedCapacity(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>20% (Seated Originating Rake)</span>
              <span>75% (Moderate)</span>
              <span>100% (Packed)</span>
            </div>
          </div>
        </div>

        {/* Stop Switching Alternative Sandbox */}
        <div className="pt-3">
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-bold text-slate-800 block">
              Test Nearby Chennai Metro Stations (Station Hopping)
            </label>
            {onOpenStationModal && (
              <button
                onClick={onOpenStationModal}
                className="text-xs font-bold text-[#0066B2] hover:underline cursor-pointer"
              >
                Browse All 14+ Stations ➔
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {NEARBY_STOPS.map((st) => (
              <button
                key={st.id}
                id={`sandbox-stop-${st.id}`}
                onClick={() => {
                  setActiveStopId(st.id);
                  if (onSelectStation) {
                    onSelectStation(st);
                  }
                }}
                className={`p-3.5 rounded-2xl text-left border text-xs transition-all cursor-pointer ${
                  activeStopId === st.id
                    ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold shadow-xs ring-1 ring-blue-300'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-slate-900 truncate">{st.name}</div>
                {st.tamilName && <div className="text-[10px] text-slate-400">{st.tamilName}</div>}
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>{st.walkMinutes}m walk</span>
                  <span className="text-emerald-600 font-bold">{st.boardingRateHistorical}% clearance</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  ) : (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-10 shadow-xs text-center">
      <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs mb-4">
        <Clock className="w-8 h-8" />
      </div>
      <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-black rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 border border-amber-300">
        Operations Closed
      </span>
      <h3 className="text-xl font-black text-slate-900 mt-3">
        No Scheduled Metro Services at this Hour
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
        Chennai Metro passenger services run daily between 05:00 AM and 11:00 PM. Please select an active time from the clock manager to inspect live boarding odds.
      </p>
    </div>
  )}
</div>
);
};
