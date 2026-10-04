import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, Flag, TrainFront, Compass, Search, 
  ArrowRight, Clock, Sparkles, Navigation, 
  ZoomIn, ZoomOut, RotateCcw, ChevronRight, Zap, Target,
  ArrowLeftRight, CreditCard, Layers, CheckCircle2,
  Sun, Moon
} from 'lucide-react';
import { RouteStop, BusTransit } from '../types';
import { ALL_METRO_STATIONS } from '../data/transitData';
import { 
  calculateCommuterRoute, 
  BLUE_LINE_STATION_IDS, 
  GREEN_LINE_STATION_IDS,
  findStationByNameOrId 
} from '../utils/routePlanner';

interface MetroNetworkMapProps {
  currentStop: RouteStop;
  destination: string;
  buses: BusTransit[];
  onSelectStation: (station: RouteStop) => void;
  onSelectDestination: (dest: string) => void;
  onOpenBoardingEngine: (busId?: string) => void;
  onOpenSmartCoach: () => void;
}

export const MetroNetworkMap: React.FC<MetroNetworkMapProps> = ({
  currentStop,
  destination,
  buses,
  onSelectStation,
  onSelectDestination,
  onOpenBoardingEngine,
  onOpenSmartCoach,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [lineFilter, setLineFilter] = useState<'all' | 'blue' | 'green'>('all');
  const [canvasTheme, setCanvasTheme] = useState<'dark' | 'light'>('dark');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedMapStation, setSelectedMapStation] = useState<RouteStop>(currentStop);

  // Map station lookup by ID
  const stationMap = useMemo(() => {
    const map = new Map<string, RouteStop>();
    ALL_METRO_STATIONS.forEach(s => map.set(s.id, s));
    return map;
  }, []);

  // Ordered stations in true geographical sequence
  const blueLineStations = useMemo(() => {
    return BLUE_LINE_STATION_IDS
      .map(id => stationMap.get(id))
      .filter((s): s is RouteStop => Boolean(s));
  }, [stationMap]);

  const greenLineStations = useMemo(() => {
    return GREEN_LINE_STATION_IDS
      .map(id => stationMap.get(id))
      .filter((s): s is RouteStop => Boolean(s));
  }, [stationMap]);

  // Compute exact commuter route from departure to destination
  const activeRoute = useMemo(() => {
    return calculateCommuterRoute(currentStop, destination, ALL_METRO_STATIONS);
  }, [currentStop, destination]);

  const isSameStation = currentStop.id === activeRoute.destination.id;

  // Active indices on Blue Line track
  const blueActiveIndices = useMemo(() => {
    if (isSameStation) return [];
    return blueLineStations
      .map((st, i) => (activeRoute.activeStationIds.has(st.id) ? i : -1))
      .filter(i => i !== -1);
  }, [blueLineStations, activeRoute, isSameStation]);

  const minBlueIdx = blueActiveIndices.length > 0 ? Math.min(...blueActiveIndices) : -1;
  const maxBlueIdx = blueActiveIndices.length > 0 ? Math.max(...blueActiveIndices) : -1;

  // Active indices on Green Line track
  const greenActiveIndices = useMemo(() => {
    if (isSameStation) return [];
    return greenLineStations
      .map((st, i) => (activeRoute.activeStationIds.has(st.id) ? i : -1))
      .filter(i => i !== -1);
  }, [greenLineStations, activeRoute, isSameStation]);

  const minGreenIdx = greenActiveIndices.length > 0 ? Math.min(...greenActiveIndices) : -1;
  const maxGreenIdx = greenActiveIndices.length > 0 ? Math.max(...greenActiveIndices) : -1;

  // Filtered station search list
  const filteredStations = useMemo(() => {
    return ALL_METRO_STATIONS.filter((station) => {
      const matchesSearch = 
        station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (station.tamilName && station.tamilName.toLowerCase().includes(searchQuery.toLowerCase()));
      
      if (!matchesSearch) return false;
      if (lineFilter === 'blue') return station.linesServing?.some(l => l.includes('Blue'));
      if (lineFilter === 'green') return station.linesServing?.some(l => l.includes('Green'));
      return true;
    });
  }, [searchQuery, lineFilter]);

  // Handler to swap departure and destination
  const handleSwapRoute = () => {
    const destStation = findStationByNameOrId(destination, ALL_METRO_STATIONS);
    const newDest = currentStop.name;
    onSelectStation(destStation);
    onSelectDestination(newDest);
  };

  return (
    <div id="metro-network-map-view" className="space-y-6 pb-24 w-full select-none">
      {/* Header Strip & Line Filters */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs select-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-50 text-[#0066B2] shadow-xs">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading">
                Chennai Metro Network & Travel Route
              </h2>
            </div>
          </div>

          {/* Line Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 shrink-0">
            <button
              onClick={() => setLineFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                lineFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Lines
            </button>
            <button
              onClick={() => setLineFilter('blue')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                lineFilter === 'blue' ? 'bg-[#0066B2] text-white shadow-xs' : 'text-slate-600 hover:text-[#0066B2]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-300" />
              Blue Line
            </button>
            <button
              onClick={() => setLineFilter('green')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                lineFilter === 'green' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-300" />
              Green Line
            </button>
          </div>
        </div>

        {/* CONTROLS: Zoom, Theme & Reset */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Interactive map shows your origin, journey corridor, transfer points, and arrival destination.</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Canvas Theme Toggle */}
            <button
              onClick={() => setCanvasTheme(canvasTheme === 'dark' ? 'light' : 'dark')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              title="Toggle Map Canvas Background"
            >
              {canvasTheme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Light Canvas</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-blue-600" />
                  <span>Dark Canvas</span>
                </>
              )}
            </button>

            <button
              onClick={() => setZoomLevel(prev => Math.min(prev + 0.15, 1.45))}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(prev => Math.max(prev - 0.15, 0.85))}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ACTIVE COMMUTER JOURNEY CARD (Clean Light Card Design) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs relative overflow-hidden select-none">
        <div className="space-y-4">
          {/* Badge & Swap Button */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Route Overview
              </h3>
              <span className="text-xs text-slate-400">
                • {activeRoute.directionLabel}
              </span>
            </div>

            <button
              onClick={handleSwapRoute}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#0066B2] text-xs font-bold border border-slate-200 hover:border-blue-200 transition-all cursor-pointer shadow-xs"
              title="Reverse traveling direction"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-[#0066B2]" />
              <span>Reverse Route</span>
            </button>
          </div>

          {/* Route Terminals Visualization */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Origin Box */}
            <div className="md:col-span-4 bg-gradient-to-br from-blue-50/80 to-indigo-50/40 border border-blue-200/90 rounded-2xl p-4 relative shadow-xs">
              <div className="flex items-center gap-1.5 text-[#0066B2] font-mono text-[10px] font-black uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-[#0066B2]" />
                <span>Boarding Station (Origin)</span>
              </div>
              <div className="text-base sm:text-lg font-black text-slate-900 mt-1">
                {activeRoute.origin.name}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                {activeRoute.origin.tamilName || 'Corridor Station'}
              </div>
            </div>

            {/* Travel Path Summary Pill */}
            <div className="md:col-span-4 flex flex-col items-center justify-center text-center px-2 py-1">
              {isSameStation ? (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-center w-full">
                  <div className="font-bold">Origin and Destination are identical</div>
                  <div className="text-[10px] text-amber-600 mt-0.5">Please choose an arrival station below.</div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-[#0066B2] text-xs font-bold mb-1">
                    <TrainFront className="w-4 h-4 animate-pulse text-[#0066B2]" />
                    <span>{activeRoute.lineSummary}</span>
                  </div>
                  
                  <div className="w-full flex items-center justify-center gap-2 my-1">
                    <div className="h-[2px] flex-1 bg-gradient-to-r from-blue-400 to-[#0066B2]" />
                    <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="h-[2px] flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600" />
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono mt-1">
                    <span className="bg-blue-50 text-[#0066B2] px-2.5 py-0.5 rounded-lg border border-blue-200 font-bold">
                      {activeRoute.stopCount} {activeRoute.stopCount === 1 ? 'Stop' : 'Stops'}
                    </span>
                    <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-200 font-bold">
                      ~{activeRoute.estimatedMinutes} Mins
                    </span>
                    <span className="bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-lg border border-emerald-200 font-bold">
                      ₹{activeRoute.fareINR} (₹{activeRoute.fareSingaraINR} Card)
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Destination Box */}
            <div className="md:col-span-4 bg-gradient-to-br from-emerald-50/80 to-teal-50/40 border border-emerald-200/90 rounded-2xl p-4 relative shadow-xs">
              <div className="flex items-center gap-1.5 text-emerald-700 font-mono text-[10px] font-black uppercase tracking-wider">
                <Flag className="w-3.5 h-3.5 text-emerald-700" />
                <span>Destination (Arrival)</span>
              </div>
              <div className="text-base sm:text-lg font-black text-slate-900 mt-1">
                {activeRoute.destination.name}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                {activeRoute.destination.tamilName || 'Arrival Hub'}
              </div>
            </div>
          </div>

          {/* STEP-BY-STEP ITINERARY TRACK */}
          {!isSameStation && (
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-mono">
                <span className="flex items-center gap-1.5 text-slate-700 font-bold">
                  <Navigation className="w-3.5 h-3.5 text-[#0066B2]" />
                  <span>Station Itinerary ({activeRoute.stations.length} Nodes)</span>
                </span>
                <span className="text-slate-400">Scroll horizontally to preview stops ➔</span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                {activeRoute.stations.map((st, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === activeRoute.stations.length - 1;
                  const isInterchange = st.id === activeRoute.interchangeStation?.id;
                  const isSelected = selectedMapStation.id === st.id;

                  return (
                    <React.Fragment key={st.id}>
                      <button
                        onClick={() => setSelectedMapStation(st)}
                        className={`shrink-0 text-left px-3 py-2 rounded-xl transition-all cursor-pointer border ${
                          isFirst
                            ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                            : isLast
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                            : isInterchange
                            ? 'bg-purple-100 border-purple-300 text-purple-900 shadow-xs'
                            : isSelected
                            ? 'bg-slate-200 border-slate-400 text-slate-900 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/40'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${
                            isFirst ? 'bg-amber-300' : isLast ? 'bg-emerald-300' : isInterchange ? 'bg-purple-500' : 'bg-[#0066B2]'
                          }`} />
                          <span className={`text-[10px] font-mono font-bold ${isFirst || isLast ? 'text-white/80' : 'text-slate-400'}`}>
                            #{idx + 1}
                          </span>
                        </div>
                        <div className="text-xs font-bold truncate max-w-[130px] mt-0.5">
                          {st.name.replace(' Metro Station', '')}
                        </div>
                        <div className={`text-[9px] font-mono ${isFirst || isLast ? 'text-white/80' : 'text-slate-400'}`}>
                          {isFirst ? '📍 DEPARTURE' : isLast ? '🏁 DESTINATION' : isInterchange ? '🔄 TRANSFER' : `${st.boardingRateHistorical}% clearance`}
                        </div>
                      </button>

                      {!isLast && (
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SCHEMATIC SVG NETWORK CANVAS (Light / Dark Adaptive Canvas) */}
      <div className={`rounded-3xl p-6 shadow-xl border relative overflow-hidden min-h-[440px] flex flex-col justify-between select-none transition-colors duration-300 ${
        canvasTheme === 'dark' 
          ? 'bg-slate-950 border-slate-800 text-white' 
          : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        {/* Canvas Header & Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 font-mono mb-6 z-10">
          <div className="flex items-center gap-2 text-slate-400">
            <span>Zoom: {Math.round(zoomLevel * 100)}%</span>
          </div>

          {/* Visual Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-400 ring-2 ring-white" />
              <span className="text-amber-300 font-bold">Departure</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
              <span className="text-emerald-300 font-bold">Destination</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-200 border border-amber-400" />
              <span className="text-slate-300">Route Node</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 ring-2 ring-purple-300" />
              <span className="text-purple-300">Transfer</span>
            </span>
            <span className="flex items-center gap-1.5 opacity-50">
              <span className="w-2 h-2 rounded-full bg-slate-600" />
              <span className="text-slate-400">Other Node</span>
            </span>
          </div>
        </div>

        {/* Scalable Vector Schematic Line Map */}
        <div className="relative overflow-x-auto py-12 flex items-center justify-center">
          <motion.div 
            style={{ scale: zoomLevel }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="w-full max-w-4xl space-y-16 px-6"
          >
            {/* BLUE LINE CORRIDOR */}
            {(lineFilter === 'all' || lineFilter === 'blue') && (
              <div className="relative">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-blue-400 mb-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    Wimco Nagar Depot (North Terminal)
                  </span>
                  <span className="flex items-center gap-1.5">
                    Chennai Airport MAA (South Terminal)
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                  </span>
                </div>

                {/* Base Blue Track Line */}
                <div className="h-3.5 bg-slate-800 rounded-full w-full relative flex items-center justify-between px-2 shadow-inner border border-slate-700/60">
                  {/* Glowing Active Route Segment on Blue Line */}
                  {minBlueIdx !== -1 && maxBlueIdx !== -1 && !isSameStation && (
                    <div 
                      className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 shadow-[0_0_16px_rgba(245,158,11,0.8)] z-0 transition-all duration-500"
                      style={{
                        left: `${(minBlueIdx / (blueLineStations.length - 1)) * 100}%`,
                        width: `${Math.max(1, ((maxBlueIdx - minBlueIdx) / (blueLineStations.length - 1)) * 100)}%`,
                      }}
                    />
                  )}

                  {/* Animated Commuter Train Gliding Along Active Blue Track */}
                  {blueActiveIndices.length > 1 && !isSameStation && (
                    <motion.div
                      className="absolute top-1/2 -translate-y-1/2 pointer-events-none z-30"
                      animate={{
                        left: [
                          `${(minBlueIdx / (blueLineStations.length - 1)) * 100}%`,
                          `${(maxBlueIdx / (blueLineStations.length - 1)) * 100}%`,
                        ],
                      }}
                      transition={{
                        duration: Math.max(3, activeRoute.stopCount * 0.45),
                        repeat: Infinity,
                        repeatType: 'reverse',
                        ease: 'easeInOut',
                      }}
                    >
                      <div className="bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full shadow-xl shadow-amber-400/80 border border-white flex items-center gap-1 -translate-x-1/2 text-[9px] font-black font-mono">
                        <TrainFront className="w-3 h-3 text-slate-900" />
                        <span>METRO RAKE</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Station Nodes on Blue Line */}
                  {blueLineStations.map((st) => {
                    const isOrigin = activeRoute.origin.id === st.id;
                    const isDestination = activeRoute.destination.id === st.id;
                    const isTransfer = activeRoute.interchangeStation?.id === st.id;
                    const isOnRoute = activeRoute.activeStationIds.has(st.id);
                    const isSelected = selectedMapStation.id === st.id;

                    return (
                      <div key={st.id} className="relative flex flex-col items-center">
                        {/* Start Marker Label */}
                        {isOrigin && (
                          <div className="absolute -top-9 z-30 whitespace-nowrap bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md shadow-lg shadow-amber-400/40 border border-white animate-bounce flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />
                            <span>DEPARTURE</span>
                          </div>
                        )}

                        {/* Destination Marker Label */}
                        {isDestination && !isOrigin && (
                          <div className="absolute -top-9 z-30 whitespace-nowrap bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-lg shadow-emerald-500/40 border border-white animate-bounce flex items-center gap-1">
                            <Flag className="w-2.5 h-2.5" />
                            <span>DESTINATION</span>
                          </div>
                        )}

                        {/* Transfer Marker Label */}
                        {isTransfer && !isOrigin && !isDestination && (
                          <div className="absolute -top-9 z-30 whitespace-nowrap bg-purple-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-md border border-white flex items-center gap-1">
                            <span>TRANSFER</span>
                          </div>
                        )}

                        <button
                          onClick={() => {
                            setSelectedMapStation(st);
                          }}
                          className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer relative group z-10 ${
                            isOrigin
                              ? 'bg-amber-400 border-white ring-4 ring-amber-400/70 scale-135 shadow-xl'
                              : isDestination
                              ? 'bg-emerald-500 border-white ring-4 ring-emerald-400/70 scale-135 shadow-xl'
                              : isTransfer
                              ? 'bg-purple-500 border-white ring-4 ring-purple-400/50 scale-125'
                              : isSelected
                              ? 'bg-white border-[#0066B2] scale-120 shadow-md'
                              : isOnRoute && !isSameStation
                              ? 'bg-amber-200 border-amber-400 scale-110 shadow-sm'
                              : st.interchange
                              ? 'bg-purple-300/40 border-purple-400/50 opacity-40 hover:opacity-100'
                              : 'bg-blue-900/60 border-blue-500/50 opacity-35 hover:opacity-100'
                          }`}
                          title={`${st.name} (${st.boardingRateHistorical}% Clearance)`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isOrigin ? 'bg-slate-900' : isDestination ? 'bg-white' : isOnRoute ? 'bg-amber-700' : 'bg-[#0066B2]'
                          }`} />
                          
                          {/* Tooltip Label */}
                          <div className="absolute bottom-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-850 text-white text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap pointer-events-none shadow-xl border border-slate-700 z-40">
                            <div className="font-bold text-white">{st.name.split(' ')[0]}</div>
                            <div className="text-[9px] text-slate-300 font-mono">{st.boardingRateHistorical}% clearance • {st.queueLength} queue</div>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* GREEN LINE CORRIDOR */}
            {(lineFilter === 'all' || lineFilter === 'green') && (
              <div className="relative">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-400 mb-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Puratchi Thalaivar Dr. M.G.R Central
                  </span>
                  <span className="flex items-center gap-1.5">
                    St. Thomas Mount Terminal
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </span>
                </div>

                {/* Base Green Track Line */}
                <div className="h-3.5 bg-slate-800 rounded-full w-full relative flex items-center justify-between px-2 shadow-inner border border-slate-700/60">
                  {/* Glowing Active Route Segment on Green Line */}
                  {minGreenIdx !== -1 && maxGreenIdx !== -1 && !isSameStation && (
                    <div 
                      className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 to-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.8)] z-0 transition-all duration-500"
                      style={{
                        left: `${(minGreenIdx / (greenLineStations.length - 1)) * 100}%`,
                        width: `${Math.max(1, ((maxGreenIdx - minGreenIdx) / (greenLineStations.length - 1)) * 100)}%`,
                      }}
                    />
                  )}

                  {/* Animated Commuter Train Gliding Along Active Green Track */}
                  {greenActiveIndices.length > 1 && !isSameStation && (
                    <motion.div
                      className="absolute top-1/2 -translate-y-1/2 pointer-events-none z-30"
                      animate={{
                        left: [
                          `${(minGreenIdx / (greenLineStations.length - 1)) * 100}%`,
                          `${(maxGreenIdx / (greenLineStations.length - 1)) * 100}%`,
                        ],
                      }}
                      transition={{
                        duration: Math.max(3, activeRoute.stopCount * 0.45),
                        repeat: Infinity,
                        repeatType: 'reverse',
                        ease: 'easeInOut',
                      }}
                    >
                      <div className="bg-emerald-400 text-slate-900 px-2 py-0.5 rounded-full shadow-xl shadow-emerald-400/80 border border-white flex items-center gap-1 -translate-x-1/2 text-[9px] font-black font-mono">
                        <TrainFront className="w-3 h-3 text-slate-900" />
                        <span>METRO RAKE</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Station Nodes on Green Line */}
                  {greenLineStations.map((st) => {
                    const isOrigin = activeRoute.origin.id === st.id;
                    const isDestination = activeRoute.destination.id === st.id;
                    const isTransfer = activeRoute.interchangeStation?.id === st.id;
                    const isOnRoute = activeRoute.activeStationIds.has(st.id);
                    const isSelected = selectedMapStation.id === st.id;

                    return (
                      <div key={st.id} className="relative flex flex-col items-center">
                        {/* Start Marker Label */}
                        {isOrigin && (
                          <div className="absolute -top-9 z-30 whitespace-nowrap bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md shadow-lg shadow-amber-400/40 border border-white animate-bounce flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />
                            <span>DEPARTURE</span>
                          </div>
                        )}

                        {/* Destination Marker Label */}
                        {isDestination && !isOrigin && (
                          <div className="absolute -top-9 z-30 whitespace-nowrap bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-lg shadow-emerald-500/40 border border-white animate-bounce flex items-center gap-1">
                            <Flag className="w-2.5 h-2.5" />
                            <span>DESTINATION</span>
                          </div>
                        )}

                        {/* Transfer Marker Label */}
                        {isTransfer && !isOrigin && !isDestination && (
                          <div className="absolute -top-9 z-30 whitespace-nowrap bg-purple-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-md border border-white flex items-center gap-1">
                            <span>TRANSFER</span>
                          </div>
                        )}

                        <button
                          onClick={() => {
                            setSelectedMapStation(st);
                          }}
                          className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer relative group z-10 ${
                            isOrigin
                              ? 'bg-amber-400 border-white ring-4 ring-amber-400/70 scale-135 shadow-xl'
                              : isDestination
                              ? 'bg-emerald-500 border-white ring-4 ring-emerald-400/70 scale-135 shadow-xl'
                              : isTransfer
                              ? 'bg-purple-500 border-white ring-4 ring-purple-400/50 scale-125'
                              : isSelected
                              ? 'bg-white border-emerald-600 scale-120 shadow-md'
                              : isOnRoute && !isSameStation
                              ? 'bg-amber-200 border-emerald-400 scale-110 shadow-sm'
                              : st.interchange
                              ? 'bg-purple-300/40 border-purple-400/50 opacity-40 hover:opacity-100'
                              : 'bg-emerald-950/60 border-emerald-600/40 opacity-35 hover:opacity-100'
                          }`}
                          title={`${st.name} (${st.boardingRateHistorical}% Clearance)`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isOrigin ? 'bg-slate-900' : isDestination ? 'bg-white' : isOnRoute ? 'bg-emerald-800' : 'bg-emerald-600'
                          }`} />
                          
                          {/* Tooltip Label */}
                          <div className="absolute bottom-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-850 text-white text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap pointer-events-none shadow-xl border border-slate-700 z-40">
                            <div className="font-bold text-white">{st.name.split(' ')[0]}</div>
                            <div className="text-[9px] text-slate-300 font-mono">{st.boardingRateHistorical}% clearance • {st.queueLength} queue</div>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Selected Station Telemetry & Route Action Bar */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 text-white z-10 shadow-xl mt-4 select-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400 uppercase font-mono">
                  Inspected Node
                </span>
                {selectedMapStation.id === activeRoute.origin.id && (
                  <span className="text-[10px] bg-amber-400 text-slate-900 font-black px-2 py-0.5 rounded-md">
                    📍 CURRENT ORIGIN
                  </span>
                )}
                {selectedMapStation.id === activeRoute.destination.id && (
                  <span className="text-[10px] bg-emerald-500 text-white font-black px-2 py-0.5 rounded-md">
                    🏁 CURRENT DESTINATION
                  </span>
                )}
                {selectedMapStation.interchange && (
                  <span className="text-[10px] bg-purple-500/30 text-purple-300 font-bold px-2 py-0.5 rounded-md border border-purple-500/40">
                    Bi-Level Interchange
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black text-white mt-1">
                {selectedMapStation.name}
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                Queue: {selectedMapStation.queueLength} commuters • Clearance Rate: {selectedMapStation.boardingRateHistorical}% • Walking Time: {selectedMapStation.walkMinutes}m
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  onSelectStation(selectedMapStation);
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Set as Departure</span>
              </button>
              <button
                onClick={() => {
                  onSelectDestination(selectedMapStation.name);
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <Target className="w-3.5 h-3.5" />
                <span>Set Destination</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK STATION FINDER & ROUTE PRESETS */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4 select-none">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 font-heading">
              Station Finder & Quick Routes
            </h3>
            <p className="text-xs text-slate-500">
              Click any station to inspect, set departure, or set as your journey destination.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">
            {filteredStations.length} Stations Available
          </span>
        </div>

        {/* Quick Route Shortcut Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase font-mono mr-1">
            Popular Journeys:
          </span>
          {[
            { from: 'stop-guindy', to: 'Puratchi Thalaivar Dr. M.G.R Central', label: 'Guindy ➔ Central' },
            { from: 'stop-guindy', to: 'Chennai International Airport (MAA)', label: 'Guindy ➔ Airport' },
            { from: 'stop-central', to: 'Chennai International Airport (MAA)', label: 'Central ➔ Airport' },
            { from: 'stop-koyambedu', to: 'Puratchi Thalaivar Dr. M.G.R Central', label: 'Koyambedu ➔ Central' },
            { from: 'stop-vadapalani', to: 'Chennai International Airport (MAA)', label: 'Vadapalani ➔ Airport' },
          ].map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                const st = stationMap.get(preset.from);
                if (st) {
                  onSelectStation(st);
                  onSelectDestination(preset.to);
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-[#0066B2] hover:border-blue-300 border border-slate-200 text-xs font-bold text-slate-700 transition-all cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search any Chennai metro station (e.g. Guindy, Central, Airport, Vadapalani, LIC)..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0066B2] focus:bg-white font-medium select-text"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto pt-1">
          {filteredStations.map((st) => {
            const isOrigin = activeRoute.origin.id === st.id;
            const isDest = activeRoute.destination.id === st.id;
            const isOnPath = activeRoute.activeStationIds.has(st.id);

            return (
              <button
                key={st.id}
                onClick={() => {
                  setSelectedMapStation(st);
                }}
                className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                  isOrigin
                    ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold shadow-xs'
                    : isDest
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold shadow-xs'
                    : isOnPath && !isSameStation
                    ? 'bg-blue-50/70 border-blue-300 text-[#0066B2]'
                    : selectedMapStation.id === st.id
                    ? 'bg-slate-100 border-slate-400 font-bold'
                    : 'bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold truncate">{st.name.split(' ')[0]}</div>
                  {isOrigin && <span className="text-[9px] bg-amber-200 text-amber-900 px-1 rounded font-mono font-black">ORIGIN</span>}
                  {isDest && <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1 rounded font-mono font-black">DEST</span>}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {st.boardingRateHistorical}% Clearance
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};