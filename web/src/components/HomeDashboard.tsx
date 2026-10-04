import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrainFront, MapPin, Sparkles, ArrowRight, 
  Clock, CheckCircle2, AlertTriangle, Armchair, 
  Compass, ChevronRight, Zap, Target, Search, BarChart3,
  CreditCard, ShieldCheck, Layers, RefreshCw, Star, Info, Radio,
  ArrowUpDown, Check, AlertCircle, ChevronDown, ChevronUp, Ticket
} from 'lucide-react';
import { BusTransit, RouteStop, UserProfile, Language, JourneyOptionType, TelemetryDataSource } from '../types';
import { POPULAR_DESTINATIONS, ALL_METRO_STATIONS } from '../data/transitData';
import { DayOfWeek } from '../utils/timeManager';
import { LineStatusChart } from './LineStatusChart';
import { translations, getCrowdAccessibleLabel } from '../utils/translations';
import { computeJourneyOptions } from '../utils/journeyEngine';

interface HomeDashboardProps {
  buses: BusTransit[];
  currentStop: RouteStop;
  profile: UserProfile;
  selectedDestination: string;
  simulatedTime?: string;
  dayName?: DayOfWeek;
  isPeak?: boolean;
  peakLabel?: string;
  language?: Language;
  telemetrySource?: TelemetryDataSource;
  lastUpdatedSecondsAgo?: number;
  isLoading?: boolean;
  isStale?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  onRefresh?: () => void;
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
  language = 'en',
  telemetrySource = 'live',
  lastUpdatedSecondsAgo = 6,
  isLoading = false,
  isStale = false,
  hasError = false,
  errorMessage,
  onRefresh,
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
  const t = translations[language];
  const isTa = language === 'ta';

  const [searchQuery, setSearchQuery] = useState('');
  const [showDestPicker, setShowDestPicker] = useState(false);
  const [selectedJourneyType, setSelectedJourneyType] = useState<JourneyOptionType>('fastest');
  const [showWhyModal, setShowWhyModal] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Compute 3 Journey Options: Fastest, Least Crowded, Fewest Transfers
  const journeyResult = useMemo(() => {
    return computeJourneyOptions(currentStop, selectedDestination, buses, isPeak, language);
  }, [currentStop, selectedDestination, buses, isPeak, language]);

  const activeJourneyOption = journeyResult.options.find(o => o.type === selectedJourneyType) || journeyResult.options[0];
  const activeTrain = activeJourneyOption?.train || buses[0];

  // Destination filter
  const filteredDestinations = POPULAR_DESTINATIONS.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Station Swap handler (origin <-> destination)
  const handleSwapStations = () => {
    const matchingOriginAsDest = ALL_METRO_STATIONS.find(
      s => s.name.toLowerCase().includes(selectedDestination.toLowerCase()) ||
           selectedDestination.toLowerCase().includes(s.name.toLowerCase().split(' ')[0])
    );
    if (matchingOriginAsDest && onSelectStation) {
      const oldStop = currentStop;
      onSelectStation(matchingOriginAsDest);
      onSelectDestination(oldStop.name);
    } else {
      // Just swap destination to whatever origin was
      const oldStopName = currentStop.name;
      onSelectDestination(oldStopName);
    }
  };

  // Find Journey Trigger
  const handleFindJourney = () => {
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
    }, 450);
  };

  // Service Closed check
  const isClosed = !isLoading && (telemetrySource === 'closed' || (buses && buses.length === 0));

  return (
    <div id="home-dashboard-view" className="space-y-6 pb-24 w-full">
      {/* ========================================================================= */}
      {/* 1. HERO PLANNER CARD: "WHICH JOURNEY SHOULD I TAKE?"                      */}
      {/* ========================================================================= */}
      <section 
        id="hero-journey-planner-card"
        className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-xs relative overflow-hidden"
        aria-label="Commuter Journey Planning Section"
      >
        {/* Top Header & Data Transparency Ribbon */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0066B2] animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading">
                {t.heroQuestion}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              {t.heroSubtitle}
            </p>
          </div>

          {/* Data Transparency Badge & Update Timestamp */}
          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            {/* Telemetry Status Badge */}
            <div 
              id="telemetry-source-badge"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-2xs ${
                telemetrySource === 'live'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : telemetrySource === 'predicted'
                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                  : telemetrySource === 'demo'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <span className="flex h-2 w-2 relative shrink-0">
                {telemetrySource === 'live' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  telemetrySource === 'live' ? 'bg-emerald-600' :
                  telemetrySource === 'predicted' ? 'bg-purple-600' :
                  telemetrySource === 'demo' ? 'bg-amber-500' : 'bg-slate-400'
                }`} />
              </span>
              <span>
                {telemetrySource === 'live' ? t.liveSource :
                 telemetrySource === 'predicted' ? t.predictedSource :
                 telemetrySource === 'demo' ? t.demoSource : t.closedSource}
              </span>
            </div>

            {/* Last update time with refresh button */}
            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
              <span>
                {t.lastUpdated} {lastUpdatedSecondsAgo < 10 ? t.justNow : `${lastUpdatedSecondsAgo}${t.secondsAgo}`}
              </span>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  title={t.refreshBtn}
                  aria-label={t.refreshBtn}
                  className="ml-1 text-[#0066B2] hover:text-blue-700 p-0.5 rounded cursor-pointer transition-transform active:rotate-180"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stale Data Warning Banner (if applicable) */}
        {isStale && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{t.staleDataWarning}</span>
            </div>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
              >
                {t.retryBtn}
              </button>
            )}
          </div>
        )}

        {/* Journey Input Form: From, Swap, To, Departure Time, CTA */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* FROM STATION (4 cols) */}
          <div className="md:col-span-4 relative">
            <label htmlFor="planner-from-station" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              {t.fromLabel}
            </label>
            <button
              id="planner-from-station"
              type="button"
              onClick={onOpenStationModal}
              className="w-full text-left p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 transition-all flex items-center justify-between cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#0066B2] flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-slate-900 truncate">
                    {currentStop.name.replace(' Metro Station', '')}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {currentStop.tamilName || 'Platform Ready'}
                  </div>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-[#0066B2] transition-colors shrink-0" />
            </button>
          </div>

          {/* SWAP BUTTON (1 col on desktop, centered on mobile) */}
          <div className="md:col-span-1 flex justify-center -my-1 md:my-0 md:pt-6">
            <button
              id="swap-journey-stations-btn"
              type="button"
              onClick={handleSwapStations}
              title={t.swapTooltip}
              aria-label={t.swapTooltip}
              className="w-9 h-9 rounded-full bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-[#0066B2] flex items-center justify-center shadow-xs transition-all active:scale-90 cursor-pointer"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          {/* TO DESTINATION (4 cols) */}
          <div className="md:col-span-4 relative">
            <label htmlFor="planner-to-destination" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              {t.toLabel}
            </label>
            <button
              id="planner-to-destination"
              type="button"
              onClick={() => setShowDestPicker(!showDestPicker)}
              className="w-full text-left p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 transition-all flex items-center justify-between cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Compass className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-slate-900 truncate">
                    {selectedDestination.replace(' Metro Station', '')}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {isTa ? 'சேரும் இடம்' : 'Select or Search'}
                  </div>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-purple-700 transition-transform shrink-0 ${showDestPicker ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* DEPARTURE TIME & FIND BUTTON (3 cols) */}
          <div className="md:col-span-3 flex flex-col justify-end">
            <label htmlFor="planner-time-selector" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              {t.departLabel}
            </label>
            <div className="flex items-center gap-2">
              <button
                id="planner-time-selector"
                type="button"
                onClick={onOpenTimeModal}
                className="flex-1 p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between cursor-pointer shadow-2xs group"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="font-mono text-xs truncate">{simulatedTime}</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase shrink-0 ${
                  isPeak ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {isPeak ? 'Peak' : 'Opt'}
                </span>
              </button>

              <button
                id="find-journey-btn"
                type="button"
                onClick={handleFindJourney}
                className="py-3.5 px-4 bg-gradient-to-r from-[#0066B2] to-[#004b85] hover:from-[#00518f] hover:to-[#003d6d] text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                {isSearching ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{t.findJourneyBtn}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Dropdown Destination Picker (Collapsible) */}
        <AnimatePresence>
          {showDestPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-slate-100 space-y-3"
            >
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isTa ? 'சென்னையின் முக்கிய நிலையங்களை தேடுக (எ.கா. சென்ட்ரல், விமான நிலையம், எழும்பூர்)...' : 'Search Chennai destination (e.g. Central, Airport, Egmore, Koyambedu, LIC)...'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                {filteredDestinations.map((dest) => (
                  <button
                    key={dest.id}
                    id={`dest-picker-${dest.id}`}
                    onClick={() => {
                      onSelectDestination(dest.name);
                      setShowDestPicker(false);
                    }}
                    className={`p-3 rounded-xl text-left border text-xs transition-all flex items-center justify-between cursor-pointer ${
                      selectedDestination === dest.name
                        ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-bold text-slate-900 truncate">{dest.name}</div>
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
        </AnimatePresence>
      </section>

      {/* ========================================================================= */}
      {/* 2. FAILURE & SERVICE STATUS HANDLING                                      */}
      {/* ========================================================================= */}
      {isLoading ? (
        <div id="journey-loading-skeleton" className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0066B2] flex items-center justify-center mx-auto animate-pulse">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">{t.loadingTitle}</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">{t.loadingSubtitle}</p>
        </div>
      ) : hasError ? (
        <div id="journey-error-banner" className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
          <h2 className="text-base font-bold text-rose-900">{t.invalidStationTitle}</h2>
          <p className="text-xs text-rose-700">{errorMessage || t.invalidStationDesc}</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-colors cursor-pointer"
            >
              {t.retryBtn}
            </button>
          )}
        </div>
      ) : isClosed ? (
        <div id="metro-closed-state" className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto shadow-2xs">
            <Clock className="w-7 h-7" />
          </div>
          <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-extrabold rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
            {t.closedSource}
          </span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">{t.closedTitle}</h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">{t.closedDesc}</p>
          {onOpenTimeModal && (
            <div className="pt-2">
              <button
                onClick={onOpenTimeModal}
                className="px-5 py-2.5 rounded-2xl bg-[#0066B2] hover:bg-blue-600 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Clock className="w-4 h-4" />
                <span>Simulate Morning Service (08:30 AM)</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* 3. JOURNEY RESULTS: COMPARE FASTEST, LEAST CROWDED, FEWEST TRANSFERS       */}
          {/* ========================================================================= */}
          <section id="journey-comparison-section" className="space-y-3" aria-label="Journey Comparison Options">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
                  {isTa ? 'பயண தேர்வுகள்' : 'Personalized Comparison'}
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {isTa ? '3 சிறந்த வழித்தடங்கள்' : 'Compare 3 Recommended Options'}
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-xl shadow-2xs font-bold">
                {journeyResult.estimatedStops} {isTa ? 'நிலையங்கள்' : 'stops'} • {journeyResult.isDirect ? (isTa ? 'நேரடி' : 'Direct') : (isTa ? '1 இடமாற்றம்' : '1 Transfer')}
              </span>
            </div>

            {/* 3-Column Bento Journey Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {journeyResult.options.map((option) => {
                const isSelected = selectedJourneyType === option.type;
                const isFastest = option.type === 'fastest';
                const isLeastCrowded = option.type === 'least_crowded';

                return (
                  <button
                    key={option.type}
                    id={`journey-card-${option.type}`}
                    type="button"
                    onClick={() => {
                      setSelectedJourneyType(option.type);
                      onSelectBus(option.train);
                    }}
                    className={`text-left p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50/70 border-[#0066B2] shadow-sm ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-1.5 mb-2.5">
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                          isFastest 
                            ? 'bg-blue-100 text-[#0066B2] border-blue-200' 
                            : isLeastCrowded 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-purple-100 text-purple-800 border-purple-200'
                        }`}>
                          {option.badge}
                        </span>

                        {isSelected && (
                          <span className="flex items-center gap-1 text-[10px] text-white font-extrabold bg-[#0066B2] px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3 stroke-[3]" />
                            {isTa ? 'தேர்வு' : 'Active'}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-black text-slate-900 tracking-tight">
                        {option.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        {option.type === 'fastest' ? t.fastestSubtitle :
                         option.type === 'least_crowded' ? t.leastCrowdedSubtitle : t.fewestTransfersSubtitle}
                      </p>

                      {/* Primary Stats: Duration & Fare */}
                      <div className="mt-3.5 pt-3.5 border-t border-slate-100/90 grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            {t.durationLabel}
                          </span>
                          <span className="text-lg font-black text-slate-900 font-mono tracking-tight">
                            {option.durationFormatted}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            {t.fareLabel}
                          </span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-black text-emerald-700 font-mono tracking-tight">
                              {option.singaraFare}
                            </span>
                            <span className="text-[10px] text-slate-400 line-through font-mono">
                              {option.fare}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Transfer and Coach Spec */}
                      <div className="mt-3 space-y-1.5 text-[11px]">
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <TrainFront className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{option.transferInstruction}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <Armchair className="w-3.5 h-3.5 text-[#0066B2] shrink-0" />
                          <span className="truncate">{option.coachRecommendation}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Crowd Level indicator beyond color */}
                    <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500">
                        {getCrowdAccessibleLabel(option.crowdLevel, language)}
                      </span>
                      <span className="text-xs font-mono font-black text-[#0066B2]">
                        {option.boardingProbability}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 4. TRAIN CARD: DIRECTION, ARRIVAL, CROWD CATEGORY, 1 CLEAR ACTION          */}
          {/* ========================================================================= */}
          {activeTrain && (
            <section 
              id="selected-train-card" 
              className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs relative overflow-hidden"
              aria-label="Selected Train Details and Boarding Recommendation"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Train Direction & Line */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 bg-blue-50 text-[#0066B2] text-[11px] font-black rounded-lg uppercase tracking-wider border border-blue-200">
                      {activeTrain.lineType || 'Blue Line Express'}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                      Train #{activeTrain.routeNumber}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                      <Radio className="w-3 h-3 animate-pulse" />
                      {activeTrain.currentLocation ? `At ${activeTrain.currentLocation.replace(' Metro Station', '')}` : 'In Transit'}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {activeTrain.name}
                  </h3>

                  {/* Arrival Estimate & Direction */}
                  <div className="flex items-center gap-3 flex-wrap text-sm text-slate-600 font-medium">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <Clock className="w-4 h-4 text-[#0066B2]" />
                      <span>{t.arrivingIn}</span>
                      <span className="text-[#0066B2] font-black font-mono text-base">
                        {activeTrain.arrivalMinutes} {isTa ? 'நிமிடங்கள்' : 'min'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        ({activeTrain.realArrivalTime || simulatedTime})
                      </span>
                    </div>

                    <span className="text-slate-300">•</span>

                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">{t.platformLabel}:</span>
                      <strong className="text-slate-900">{activeTrain.platformNumber || 'Platform 2'}</strong>
                    </div>

                    <span className="text-slate-300">•</span>

                    <div>
                      <span className="text-slate-500">{isTa ? 'இலக்கு' : 'Bound for'}:</span>{' '}
                      <strong className="text-slate-900">{selectedDestination.replace(' Metro Station', '')}</strong>
                    </div>
                  </div>

                  {/* Crowd Category beyond color */}
                  <div className="pt-2 flex items-center gap-3 flex-wrap">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        activeTrain.crowdLevel === 'Low' ? 'bg-emerald-500' :
                        activeTrain.crowdLevel === 'Moderate' ? 'bg-amber-500' : 'bg-rose-500'
                      }`} />
                      <span>{getCrowdAccessibleLabel(activeTrain.crowdLevel, language)}</span>
                    </div>

                    <div className="text-xs text-slate-500 font-medium">
                      <span className="font-mono font-bold text-emerald-700">{activeTrain.seatsAvailable}</span> {isTa ? 'காலி இருக்கைகள்' : 'open seats available'}
                    </div>
                  </div>
                </div>

                {/* Primary Action Button & Accordion Toggle */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 justify-center">
                  <button
                    id="board-selected-train-btn"
                    type="button"
                    onClick={() => onStartTrip(activeTrain)}
                    className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#0066B2] to-[#004b85] hover:from-[#00518f] hover:to-[#003d6d] text-white font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/25 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <TrainFront className="w-4 h-4" />
                    <span>{t.boardNowBtn}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    id="toggle-why-recommendation-btn"
                    type="button"
                    onClick={() => setShowWhyModal(!showWhyModal)}
                    className="py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5 text-[#0066B2]" />
                    <span>{showWhyModal ? t.hideRecBtn : t.whyThisRecBtn}</span>
                    {showWhyModal ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* TECHNICAL DETAILS ACCORDION: "WHY THIS RECOMMENDATION?" */}
              <AnimatePresence>
                {showWhyModal && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 pt-5 border-t border-slate-100 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#0066B2]" />
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          {isTa ? 'AI பரிந்துரை பகுப்பாய்வு' : 'AI Reasoning & Calibration Telemetry'}
                        </h4>
                      </div>
                      <span className="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                        {t.mlConfidence}: {activeTrain.confidenceScore || 96.4}%
                      </span>
                    </div>

                    {/* 4-Coach Car Congestion Indicator */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2.5">
                        <span className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-[#0066B2]" />
                          {isTa ? '4 பெட்டிகளின் நெரிசல் விவரம்:' : '4-Car Coach Load Distribution:'}
                        </span>
                        <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-mono font-bold flex items-center gap-1">
                          <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                          {isTa ? 'பெட்டி 4 (பின்பகுதி) சிறந்தது' : 'Stand at Coach 4 (Rear)'}
                        </span>
                      </div>

                      {(() => {
                        const breakdown = activeTrain.crowdBreakdown || { front: 40, middle: 70, rear: 32 };
                        return (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center">
                              <span className="text-[10px] font-bold text-slate-400 block">{isTa ? 'பெட்டி 1 (பெண்கள்)' : 'Coach 1 (Women)'}</span>
                              <span className="text-xs font-black text-slate-800 font-mono">{breakdown.front}% load</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
                              <span className="text-[10px] font-bold text-amber-700 block">{isTa ? 'பெட்டி 2 (நடு)' : 'Coach 2 (Mid)'}</span>
                              <span className="text-xs font-black text-amber-800 font-mono">{breakdown.middle}% load</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
                              <span className="text-[10px] font-bold text-amber-700 block">{isTa ? 'பெட்டி 3 (நடு)' : 'Coach 3 (Mid)'}</span>
                              <span className="text-xs font-black text-amber-800 font-mono">{breakdown.middle}% load</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-center ring-1 ring-emerald-200">
                              <span className="text-[10px] font-bold text-emerald-700 block flex items-center justify-center gap-1">
                                {isTa ? 'பெட்டி 4 (பின்) ★' : 'Coach 4 (Rear) ★'}
                              </span>
                              <span className="text-xs font-black text-emerald-700 font-mono">{breakdown.rear}% load</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Explanatory bullet points */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                      <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900">{isTa ? 'அதிக போர்டிங் நிகழ்தகவு:' : 'High Boarding Clearance:'}</strong>{' '}
                          {activeTrain.boardingProbability}% posterior certainty based on {currentStop.queueLength} queue count and rapid 8-door dwell cycle.
                        </div>
                      </div>

                      <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 flex items-start gap-2">
                        <CreditCard className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900">{isTa ? 'சிங்கார கார்டு தள்ளுபடி:' : 'Singara NCMC Discount:'}</strong>{' '}
                          Save 20% ({activeJourneyOption.singaraFare} vs {activeJourneyOption.fare}) with automatic tap-and-go turnstiles.
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => onOpenBoardingEngine(activeTrain.id)}
                        className="text-xs font-bold text-[#0066B2] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Target className="w-3.5 h-3.5" />
                        <span>Open ML Prediction Sandbox & Factors ➔</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          )}

          {/* ========================================================================= */}
          {/* 5. NETWORK MAP BANNER & UPCOMING TRAINS FLEET                             */}
          {/* ========================================================================= */}
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
                      {isTa ? 'சென்னை மெட்ரோ நெட்வொர்க் வரைபடம்' : 'Explore Full Chennai Metro Network Map'}
                      <ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
                    </h3>
                    <p className="text-xs text-slate-300 font-medium">
                      {isTa 
                        ? 'நீலம் மற்றும் பச்சை வழித்தடங்களில் நிலையங்களைத் தொட்டு நேரலை ரயில்களைக் காண்க.' 
                        : 'Tap stations along Blue & Green lines to quickly switch active stop, check real-time train positions, and plan transfers.'}
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
                  <span>{isTa ? 'வரைபடத்தைத் திற' : 'Open Metro Map'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* D3-BASED LINE STATUS & CROWDING HEATMAP */}
          <LineStatusChart
            currentStop={currentStop}
            isPeak={isPeak}
            onSelectStation={onSelectStation}
          />

          {/* UPCOMING TRAINS FLEET AT CURRENT STOP */}
          <section className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  {isTa ? 'அடுத்து வரும் ரயில்கள்' : 'Upcoming Trains Fleet'}
                </h3>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {isTa ? `${currentStop.name} இல் வரவிருக்கும் ரயில்கள்` : `Real-time Inbound Trains at ${currentStop.name.replace(' Metro Station', '')}`}
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500 font-semibold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                {buses.length} {isTa ? 'ரயில்கள்' : 'trains tracked'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {buses.slice(0, 4).map((bus) => (
                <div
                  key={bus.id}
                  onClick={() => onSelectBus(bus)}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    activeTrain.id === bus.id
                      ? 'bg-blue-50/60 border-blue-300 ring-1 ring-blue-200'
                      : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-mono font-black text-sm border border-slate-200 text-slate-900">
                      {bus.routeNumber}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{bus.name.split('•')[0]}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <span>{t.arrivingIn} <strong className="text-[#0066B2]">{bus.arrivalMinutes}m</strong></span>
                        <span>•</span>
                        <span>{bus.seatsAvailable} seats</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-black font-mono text-[#0066B2]">
                      {bus.boardingProbability}%
                    </div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase">
                      {bus.crowdLevel}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
};
