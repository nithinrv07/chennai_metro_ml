import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrainFront, MapPin, Sparkles, BrainCircuit, ArrowRight, 
  Users, Clock, CheckCircle2, AlertTriangle, Armchair, 
  Compass, ChevronRight, Zap, Target, Search, BarChart3, TrendingUp,
  CreditCard, ShieldCheck, Layers, RefreshCw, Star, Info, Radio
} from 'lucide-react';
import { BusTransit, RouteStop, UserProfile } from '../types';
import { POPULAR_DESTINATIONS, ALL_METRO_STATIONS } from '../data/transitData';
import { DayOfWeek } from '../utils/timeManager';
import { LineStatusChart } from './LineStatusChart';

interface HomeDashboardProps {
  buses: BusTransit[];
  currentStop: RouteStop;
  profile: UserProfile;
  selectedDestination: string;
  simulatedTime?: string;
  dayName?: DayOfWeek;
  isPeak?: boolean;
  peakLabel?: string;
  onOpenTimeModal?: () => void;
  onOpenStationModal?: () => void;
  onSelectStation?: (station: RouteStop) => void;
  onSelectDestination: (dest: string) => void;
  onSelectBus: (bus: BusTransit) => void;
  onOpenBoardingEngine: (busId?: string) => void;
  onOpenSmartCoach: () => void;
  onOpenCrowdDNA: () => void;
  onOpenMetroMap?: () => void;
  onStartTrip: (bus: BusTransit) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  buses,
  currentStop,
  profile,
  selectedDestination,
  simulatedTime = '08:26 AM',
  dayName = 'Monday',
  isPeak = true,
  peakLabel = 'Anna Salai Rush Surge',
  onOpenTimeModal,
  onOpenStationModal,
  onSelectStation,
  onSelectDestination,
  onSelectBus,
  onOpenBoardingEngine,
  onOpenSmartCoach,
  onOpenCrowdDNA,
  onOpenMetroMap,
  onStartTrip,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDestPicker, setShowDestPicker] = useState(false);

  // Recommended / Nearest metro train
  const heroBus = buses.find((b) => b.isRecommended) || buses[0];
  const otherBuses = buses.filter((b) => b.id !== heroBus.id);

  const filteredDestinations = POPULAR_DESTINATIONS.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const popularStations = ALL_METRO_STATIONS.slice(0, 6);

  // Determine probability visual styles
  const isHighProb = heroBus.boardingProbability >= 80;
  const isMedProb = heroBus.boardingProbability >= 60 && heroBus.boardingProbability < 80;
  const probColorClass = isHighProb
    ? 'text-emerald-500'
    : isMedProb
    ? 'text-amber-500'
    : 'text-rose-500';
  const probBgClass = isHighProb
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : isMedProb
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-rose-50 text-rose-700 border-rose-200';

  return (
    <div id="home-dashboard-view" className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Station & Destination Strip */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Current Station Section */}
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 text-[#0066B2] flex items-center justify-center font-bold shrink-0 shadow-xs">
              <MapPin className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1.5 flex-wrap">
                <span>Departing from</span>
                {currentStop.interchange ? (
                  <span className="text-[9px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full border border-purple-200">
                    Interchange Hub
                  </span>
                ) : (
                  <span className="text-[9px] bg-blue-100 text-[#0066B2] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                    Platform Active
                  </span>
                )}
                <span className="text-[10px] text-slate-400 font-normal">
                  ({currentStop.queueLength} in platform queue • {currentStop.boardingRateHistorical}% historical clearance)
                </span>
              </div>
              <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate mt-0.5">
                {currentStop.name}
                {currentStop.tamilName && (
                  <span className="text-xs text-slate-400 font-medium ml-1.5 hidden sm:inline">
                    ({currentStop.tamilName})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons for Station and Destination */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              id="change-current-station-btn"
              onClick={onOpenStationModal}
              className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-xs font-bold text-[#0066B2] flex items-center gap-1.5 transition-all shadow-xs active:scale-98 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Change Station</span>
            </button>

            <button
              id="switch-dest-btn"
              onClick={() => setShowDestPicker(!showDestPicker)}
              className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-all shadow-xs active:scale-98 cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-slate-500" />
              <span>{showDestPicker ? 'Close' : 'Destination'}</span>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showDestPicker ? 'rotate-90' : ''}`} />
            </button>
          </div>
        </div>

        {/* Destination Dropdown / Grid */}
        {showDestPicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="pt-4 border-t border-slate-100 space-y-3"
          >
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Chennai destination (e.g., Central, Airport, OMR, Koyambedu, LIC)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
              {filteredDestinations.map((dest) => (
                <button
                  key={dest.id}
                  id={`dest-item-${dest.id}`}
                  onClick={() => {
                    onSelectDestination(dest.name);
                    setShowDestPicker(false);
                  }}
                  className={`p-3 rounded-xl text-left border text-xs transition-all flex items-center justify-between cursor-pointer ${
                    selectedDestination === dest.name
                      ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="font-bold text-slate-900">{dest.name}</div>
                    <div className="text-[10px] text-slate-400">{dest.category} • {dest.line}</div>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0 font-mono bg-slate-100 px-2 py-0.5 rounded-md font-semibold">
                    {dest.typicalEta}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* BENTO GRID: PRIMARY PREDICTION + SMART COACH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* SECTION 1: PRIMARY PREDICTION HERO CARD (8 cols) */}
        <section className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div>
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-black rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 border border-emerald-300 shadow-xs">
                    <span className="flex h-2 w-2 relative shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                    </span>
                    Current Approaching Train
                  </span>
                  <span className="px-3 py-1 bg-blue-50 text-[#0066B2] text-xs font-bold rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 border border-blue-100">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    CMRL ML Prediction
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    heroBus.lineColor === 'green'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-blue-50 text-[#0066B2] border-blue-200'
                  }`}>
                    {heroBus.lineType || 'Blue Line'}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-bold">
                    4-Car Alstom Rake
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3 tracking-tight flex items-center gap-2">
                  <span>Metro {heroBus.routeNumber}</span>
                  <span className="text-slate-300 font-normal">|</span>
                  <span className="text-base sm:text-xl font-bold text-slate-700">{heroBus.name}</span>
                </h2>
                
                {/* Real Arriving Time & Platform Badge */}
                <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50/90 border border-blue-200 text-[#0066B2] shadow-xs">
                    <Clock className="w-4 h-4 text-[#0066B2] shrink-0 animate-pulse" />
                    <div className="flex items-baseline gap-1.5 font-mono">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">Arrival Time:</span>
                      <span className="text-sm font-black text-[#0066B2]">
                        {heroBus.realArrivalTime || simulatedTime}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-600 text-xs sm:text-sm font-medium flex items-center gap-1.5 flex-wrap">
                    <span>Arriving in <span className="text-[#0066B2] font-black">{heroBus.arrivalMinutes} minutes</span> at <strong className="text-slate-800">{heroBus.platformNumber || 'Platform 2'}</strong></span>
                    {heroBus.currentLocation && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-600 text-xs flex items-center gap-1 font-sans font-semibold">
                          <Radio className="w-3 h-3 text-emerald-600 animate-pulse shrink-0" />
                          Live: {heroBus.currentLocation}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Big High Probability Pill */}
              <div className="sm:text-right flex sm:flex-col items-baseline sm:items-end justify-between gap-1.5 shrink-0">
                <div className={`text-5xl sm:text-6xl font-black font-mono tracking-tight leading-none ${probColorClass}`}>
                  {heroBus.boardingProbability}%
                </div>
                <div className={`text-xs font-extrabold px-3 py-1 rounded-lg uppercase tracking-wider border ${probBgClass}`}>
                  {heroBus.boardingProbability >= 80 ? 'HIGH PROBABILITY' : heroBus.boardingProbability >= 60 ? 'MODERATE PROBABILITY' : 'LOW CLEARANCE'}
                </div>
              </div>
            </div>

            {/* 4 Bento Fact Metric Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <p className="text-xl sm:text-2xl font-black text-slate-900">{heroBus.crowdLevel}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold mt-1 tracking-widest">Train Crowd</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono">{heroBus.capacityPercentage}%</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold mt-1 tracking-widest">Rake Load</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <p className="text-xl sm:text-2xl font-black text-[#0066B2] font-mono">{heroBus.seatsAvailable}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold mt-1 tracking-widest">Open Seats</p>
              </div>

              <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-100 text-center">
                <p className="text-xl sm:text-2xl font-black text-[#0066B2] font-mono">{heroBus.historicalSuccessRate}%</p>
                <p className="text-[10px] text-blue-700/70 uppercase font-bold mt-1 tracking-widest">Clearance Rate</p>
              </div>
            </div>

            {/* 4-Coach Car Congestion Indicator */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2.5">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#0066B2]" />
                  4-Car Coach Load Distribution:
                </span>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-mono font-bold flex items-center gap-1">
                  <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                  Stand at Coach 4 (Rear)
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 block">Coach 1 (Women)</span>
                  <span className="text-xs font-black text-slate-800 font-mono">{heroBus.crowdBreakdown.front}% load</span>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-center">
                  <span className="text-[10px] font-bold text-rose-500 block">Coach 2 (Mid)</span>
                  <span className="text-xs font-black text-rose-700 font-mono">{heroBus.crowdBreakdown.middle}% load</span>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-center">
                  <span className="text-[10px] font-bold text-rose-500 block">Coach 3 (Mid)</span>
                  <span className="text-xs font-black text-rose-700 font-mono">{heroBus.crowdBreakdown.middle}% load</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-center ring-1 ring-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-700 block flex items-center justify-center gap-1">
                    Coach 4 (Rear) ★
                  </span>
                  <span className="text-xs font-black text-emerald-700 font-mono">{heroBus.crowdBreakdown.rear}% load</span>
                </div>
              </div>
            </div>

            {/* Visual Probability Fill Bar */}
            <div className="space-y-1.5 mb-2">
              <div className="flex justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                <span>Predictive Clearance Confidence</span>
                <span className="font-mono text-slate-600">{heroBus.boardingProbability}% Certainty ({heroBus.confidenceScore}% Confidence)</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${
                    heroBus.boardingProbability >= 80 ? 'bg-emerald-500' : heroBus.boardingProbability >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${heroBus.boardingProbability}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-slate-400 italic mt-3 font-medium">
              * CMRL prediction engine computes high boarding likelihood based on {currentStop.name} telemetry, 24 unallocated seats, and rapid 8-door automatic clearance.
            </p>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-3 pt-6 mt-4 border-t border-slate-100">
            <button
              id="board-now-hero-btn"
              onClick={() => onStartTrip(heroBus)}
              className="flex-1 min-w-[200px] py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#0066B2] to-[#00518f] hover:from-[#00518f] hover:to-[#003d6d] text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20 active:scale-[0.99] cursor-pointer"
            >
              <TrainFront className="w-4 h-4" />
              Board Train {heroBus.routeNumber} Now
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="hero-deep-dive-btn"
              onClick={() => onOpenBoardingEngine(heroBus.id)}
              className="py-3.5 px-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
            >
              <Target className="w-4 h-4 text-[#0066B2]" />
              Prediction Sandbox
            </button>
          </div>
        </section>

        {/* SECTION 2: SMART COACH RECOMMENDATION BENTO BLOCK (4 cols) */}
        <section className="lg:col-span-4 bg-[#0a2540] text-white rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden flex flex-col justify-between border border-blue-900/40">
          <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 bg-[#0066B2] rounded-xl text-white shadow-xs">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <span className="font-extrabold uppercase tracking-widest text-xs opacity-90 text-blue-200">
                CMRL Smart Coach
              </span>
            </div>

            <p className="text-xl sm:text-2xl font-bold leading-snug mb-4 font-heading">
              "Board <span className="text-blue-300">BL-104</span> at Platform 2. It has a <span className="text-emerald-400 font-black underline decoration-emerald-500 underline-offset-4">27% higher</span> boarding probability than Green Line GL-208."
            </p>

            <div className="bg-blue-950/80 border border-blue-800/60 rounded-2xl p-4 mb-5 space-y-1.5 text-xs text-blue-100">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                Platform Staging Guidance
              </div>
              <p className="leading-relaxed text-blue-200/90 text-[11px]">
                Stand near <strong>Coach 4 (Rear Car DMC2)</strong> at {currentStop.name.replace(' Metro Station', '')} for fastest boarding. Singara Chennai card saves 20% on fare ({heroBus.fare}).
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-2.5">
            <button
              id="coach-bento-btn"
              onClick={() => onStartTrip(heroBus)}
              className="w-full py-3.5 bg-white hover:bg-blue-50 text-[#0a2540] rounded-2xl font-black text-sm transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-[#0066B2] fill-current" />
              Board Train {heroBus.routeNumber}
            </button>

            <button
              id="coach-explore-btn"
              onClick={onOpenSmartCoach}
              className="w-full py-2.5 text-xs font-bold text-blue-200 hover:text-white transition-colors text-center cursor-pointer"
            >
              Ask CMRL Coach a Transit Dilemma ➔
            </button>
          </div>

          {/* Ambient Glow */}
          <div className="absolute -bottom-8 -right-8 w-44 h-44 bg-blue-600/25 rounded-full blur-3xl" />
        </section>
      </div>

      {/* INTERACTIVE CHENNAI METRO MAP BANNER */}
      {onOpenMetroMap && (
        <div 
          onClick={onOpenMetroMap}
          className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0a2540] rounded-3xl p-5 sm:p-6 text-white border border-slate-800 shadow-md relative overflow-hidden cursor-pointer group hover:border-blue-500/50 transition-all"
        >
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-blue-600/20 text-[#38BDF8] border border-blue-500/30 group-hover:scale-110 transition-transform shrink-0">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight group-hover:text-blue-300 transition-colors flex items-center gap-2">
                  Explore Full Chennai Metro Network Map
                  <ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-xs text-slate-300 font-medium">
                  Tap stations along Blue & Green lines to quickly switch active stop, check real-time train positions, and plan transfers.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenMetroMap();
              }}
              className="px-5 py-2.5 rounded-2xl bg-[#0066B2] hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all self-start sm:self-center shrink-0 cursor-pointer"
            >
              Open Metro Map
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Stylized background lines */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-end pr-6">
            <TrainFront className="w-36 h-36 text-white" />
          </div>
        </div>
      )}

      {/* D3-BASED LINE STATUS & CROWDING HEATMAP (SIMULTANEOUS BLUE & GREEN LINES) */}
      <LineStatusChart
        currentStop={currentStop}
        isPeak={isPeak}
        onSelectStation={onSelectStation}
      />

      {/* SECOND ROW BENTO: ALTERNATIVE TRAINS + CROWD DNA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ALTERNATIVE OPTIONS BENTO CARD (8 cols) */}
        <section className="lg:col-span-8 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Chennai Metro Live Fleet
              </h3>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                Real-time Inbound Trains at {currentStop.name}
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500 font-semibold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              {buses.length} live trains tracked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {buses.map((bus) => {
              const isHero = bus.id === heroBus.id;
              const probColor = bus.boardingProbability >= 80 
                ? 'text-emerald-600' 
                : bus.boardingProbability >= 60 
                ? 'text-amber-600' 
                : 'text-rose-600';

              const badgeColor = bus.lineColor === 'green'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-blue-50 text-[#0066B2] border-blue-200';

              return (
                <div
                  key={bus.id}
                  id={`bento-bus-item-${bus.id}`}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    isHero
                      ? 'bg-blue-50/40 border-blue-300 ring-1 ring-blue-200 shadow-xs'
                      : 'bg-slate-50/80 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-base font-mono border border-slate-200 shadow-xs text-slate-900">
                      {bus.routeNumber}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-bold text-sm text-slate-900">{bus.name.split('•')[0]}</p>
                        {isHero && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Current
                          </span>
                        )}
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${badgeColor}`}>
                          {bus.lineType || 'Metro'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium flex items-center gap-1.5 flex-wrap">
                        <span>Arriving <strong className="text-slate-900 font-mono font-bold">{bus.realArrivalTime || simulatedTime}</strong></span>
                        <span className="text-slate-300">•</span>
                        <span>in <strong className="text-[#0066B2] font-bold">{bus.arrivalMinutes} min</strong></span>
                        <span className="text-slate-300">•</span>
                        <span>{bus.seatsAvailable} seats</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className={`text-xl font-black font-mono leading-none ${probColor}`}>
                      {bus.boardingProbability}%
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                      Probability
                    </p>
                    <button
                      onClick={() => onSelectBus(bus)}
                      className="mt-1 text-[11px] font-bold text-[#0066B2] hover:underline block cursor-pointer"
                    >
                      Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CROWD DNA TREND BENTO CARD (4 cols) */}
        <section 
          id="home-crowd-dna-bento"
          onClick={onOpenCrowdDNA}
          className="lg:col-span-4 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:border-blue-300 cursor-pointer transition-all group"
        >
          <div>
            <div className="flex justify-between items-center mb-5">
              <span className="font-black uppercase tracking-widest text-xs text-slate-400">
                Chennai Metro Crowd DNA
              </span>
              <span className="px-2 py-0.5 bg-blue-50 text-[#0066B2] font-black text-[10px] rounded-md uppercase tracking-wider">
                Live Pattern
              </span>
            </div>

            {/* Stylized Visual Bar Chart */}
            <div className="flex items-end justify-between gap-1.5 h-24 mb-2 px-1">
              <div className="w-full bg-blue-100 rounded-t-lg transition-all group-hover:bg-blue-200" style={{ height: '78%' }} title="08:00 AM (78%)" />
              <div className="w-full bg-rose-500 rounded-t-lg transition-all" style={{ height: '94%' }} title="08:30 AM Peak Rush (94%)" />
              <div className="w-full bg-blue-300 rounded-t-lg transition-all group-hover:bg-blue-400" style={{ height: '68%' }} title="09:00 AM (68%)" />
              <div className="w-full bg-emerald-500 rounded-t-lg transition-all" style={{ height: '36%' }} title="09:15 AM Optimal (36%)" />
              <div className="w-full bg-blue-100 rounded-t-lg transition-all group-hover:bg-blue-200" style={{ height: '28%' }} title="09:45 AM (28%)" />
              <div className="w-full bg-blue-100 rounded-t-lg transition-all group-hover:bg-blue-200" style={{ height: '30%' }} title="12:00 PM (30%)" />
            </div>

            <div className="flex justify-between text-[10px] font-bold font-mono text-slate-400 pt-1">
              <span>08:00</span>
              <span className="text-rose-500 font-bold">08:30 (Peak)</span>
              <span className="text-emerald-600 font-bold">09:15</span>
              <span>09:45</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-sm font-bold text-slate-900">
              Optimal Window: <span className="text-emerald-600 font-black ml-1">09:15 AM (97% Boarding)</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Morning office rush eases significantly after 09:10 AM at {currentStop.name.replace(' Metro Station', '')}.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
