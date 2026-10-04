/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Navbar } from './components/Navbar';
import { BottomNav, NavTab } from './components/BottomNav';
import { SplashScreen } from './components/SplashScreen';
import { OnboardingModal } from './components/OnboardingModal';
import { LoginModal } from './components/LoginModal';
import { HomeDashboard } from './components/HomeDashboard';
import { LiveTrackingModal } from './components/LiveTrackingModal';
import { TripCompletedModal } from './components/TripCompletedModal';
import { ProfileModal } from './components/ProfileModal';
import { TimeControllerModal } from './components/TimeControllerModal';
import { StationSelectModal } from './components/StationSelectModal';
import { INITIAL_BUSES, ALL_METRO_STATIONS, NEARBY_STOPS, INITIAL_PROFILE } from './data/transitData';
import { BusTransit, UserProfile, RouteStop, Language, TelemetryDataSource } from './types';
import { fetchMLHealth, fetchMLTrains, MLHealthResponse } from './utils/mlApi';
import { servesJourney, planRoute } from './utils/metroNetwork';
import { LatestRequest } from './utils/predictionState';
import { 
  TimeMode, DayOfWeek, formatTime12h, getDayName, 
  evaluatePeakStatus, getRecalculatedTrains, computeRealArrivalTime 
} from './utils/timeManager';
import { RefreshCw, MapPin, TrainFront } from 'lucide-react';

// ============================================================================
// PERFORMANCE UPGRADE: Lazy-load large bundles (D3 Network Map, ML Diagnostics, Crowd DNA)
// Reduces initial JavaScript entry chunk from ~650 KB to lightweight commuter shell
// ============================================================================
const MetroNetworkMap = lazy(() => 
  import('./components/MetroNetworkMap').then(module => ({ default: module.MetroNetworkMap }))
);

const MLDiagnosticsModal = lazy(() => 
  import('./components/MLDiagnosticsModal').then(module => ({ default: module.MLDiagnosticsModal }))
);

const BoardingProbabilityEngine = lazy(() => 
  import('./components/BoardingProbabilityEngine').then(module => ({ default: module.BoardingProbabilityEngine }))
);

const SmartCoach = lazy(() => 
  import('./components/SmartCoach').then(module => ({ default: module.SmartCoach }))
);

const CrowdDNA = lazy(() => 
  import('./components/CrowdDNA').then(module => ({ default: module.CrowdDNA }))
);

// Fallback loader for lazy-loaded screens
const ViewLoader: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex flex-col items-center justify-center py-20 px-4 space-y-3 bg-white/60 backdrop-blur-sm rounded-3xl border border-slate-200">
    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0066B2] flex items-center justify-center animate-spin">
      <RefreshCw className="w-5 h-5" />
    </div>
    <span className="text-xs font-bold text-slate-600">{label}...</span>
  </div>
);

export default function App() {
  // App Lifecycle States
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false); // Onboarding is optional
  const [showLogin, setShowLogin] = useState<boolean>(false);
  
  // Navigation & View States: commuter-first tabs ('plan', 'map', 'mytrip', 'trends')
  const [activeTab, setActiveTab] = useState<NavTab>('plan');
  const [language, setLanguage] = useState<Language>('en');
  const [selectedBusId, setSelectedBusId] = useState<string>(INITIAL_BUSES[0].id);
  const [selectedDestination, setSelectedDestination] = useState<string>('Puratchi Thalaivar Dr. M.G.R Central');
  const [currentStop, setCurrentStop] = useState<RouteStop>(ALL_METRO_STATIONS[0] || NEARBY_STOPS[0]);
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [buses, setBuses] = useState<BusTransit[]>([]);

  // Data Transparency & Network States
  const [telemetrySource, setTelemetrySource] = useState<TelemetryDataSource>('demo');
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
  const [secondsAgo, setSecondsAgo] = useState<number>(0);
  const [isFetchingTrains, setIsFetchingTrains] = useState<boolean>(false);
  const [hasFetchError, setHasFetchError] = useState<boolean>(false);
  const [fetchErrorMessage, setFetchErrorMessage] = useState<string>('');

  // Active Trip & Modal States
  const [activeTrackingBus, setActiveTrackingBus] = useState<BusTransit | null>(null);
  const [completedTripBus, setCompletedTripBus] = useState<BusTransit | null>(null);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showTimeModal, setShowTimeModal] = useState<boolean>(false);
  const [showStationModal, setShowStationModal] = useState<boolean>(false);
  const [showMLModal, setShowMLModal] = useState<boolean>(false);
  const [showSandboxModal, setShowSandboxModal] = useState<boolean>(false);
  const [mlHealth, setMlHealth] = useState<MLHealthResponse | null>(null);

  const trainRequest = useRef(new LatestRequest());

  // Dynamic Live & Simulation Time Engine
  const [timeMode, setTimeMode] = useState<TimeMode>('live');
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [customHours, setCustomHours] = useState<number>(8);
  const [customMinutes, setCustomMinutes] = useState<number>(30);
  const [customDay, setCustomDay] = useState<DayOfWeek>('Monday');

  // Real-time ticking clock interval
  useEffect(() => {
    if (timeMode !== 'live') return;
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [timeMode]);

  // Update seconds ago counter every second
  useEffect(() => {
    const ticker = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdateTime) / 1000));
    }, 1000);
    return () => clearInterval(ticker);
  }, [lastUpdateTime]);

  // Derive active time values
  const isLive = timeMode === 'live';
  const activeHours = isLive ? currentDate.getHours() : customHours;
  const activeMinutes = isLive ? currentDate.getMinutes() : customMinutes;
  const activeDay = isLive ? getDayName(currentDate.getDay()) : customDay;

  const { isPeak, peakLabel } = evaluatePeakStatus(activeHours, activeMinutes, activeDay);
  const simulatedTime = formatTime12h(activeHours, activeMinutes);

  // Health is independent of prediction provenance and is refreshed after outages.
  useEffect(() => {
    const controller = new AbortController();
    const updateHealth = async () => {
      const data = await fetchMLHealth(controller.signal);
      if (!controller.signal.aborted) setMlHealth(data);
    };
    updateHealth();
    const timer = setInterval(updateHealth, 30000);
    return () => { clearInterval(timer); controller.abort(); };
  }, []);

  const fetchTrainsData = useCallback(async () => {
    const request = trainRequest.current.begin();
    setIsFetchingTrains(true);
    setHasFetchError(false);
    setFetchErrorMessage('');
    setBuses([]);
    const isWeekend = activeDay === 'Saturday' || activeDay === 'Sunday';
    try {
      const route = planRoute(currentStop.id, selectedDestination);
      if (!route) throw new Error('Choose a destination different from your current station.');
      const result = await fetchMLTrains(currentStop.name, selectedDestination, activeHours,
        activeMinutes, activeDay, isWeekend, isPeak, request.signal);
      if (!trainRequest.current.isCurrent(request)) return;
      if (result.kind === 'invalid_request') {
        setHasFetchError(true);
        setFetchErrorMessage(result.message);
        setTelemetrySource('demo');
      } else if (result.kind === 'unavailable') {
        const estimates = getRecalculatedTrains(activeHours, activeMinutes, activeDay, currentStop, selectedDestination);
        setBuses(estimates);
        setTelemetrySource(activeHours < 5 || activeHours >= 23 ? 'closed' : 'demo');
        if (!estimates.length && activeHours >= 5 && activeHours < 23) {
          setHasFetchError(true);
          setFetchErrorMessage('No matching trains are available for this journey.');
        }
      } else if (result.kind === 'closed') {
        setTelemetrySource('closed');
      } else {
        const compatible = result.data.trains.filter(t => servesJourney(t, currentStop.id, selectedDestination));
        setBuses(compatible.map(t => ({ ...t,
          realArrivalTime: t.realArrivalTime || computeRealArrivalTime(activeHours, activeMinutes, t.arrivalMinutes) })));
        setTelemetrySource(result.data.source === 'ml' ? 'predicted' : 'demo');
        if (!compatible.length) {
          setHasFetchError(true);
          setFetchErrorMessage('No matching trains are available for this journey.');
        }
      }
      setLastUpdateTime(Date.now());
      setSecondsAgo(0);
    } catch (err: any) {
      if (!trainRequest.current.isCurrent(request)) return;
      setBuses([]);
      setHasFetchError(true);
      setFetchErrorMessage(err.message || 'Could not load this journey.');
      setTelemetrySource('demo');
    } finally {
      if (trainRequest.current.isCurrent(request)) setIsFetchingTrains(false);
    }
  }, [activeHours, activeMinutes, activeDay, currentStop, selectedDestination, isPeak]);

  useEffect(() => {
    fetchTrainsData();
    return () => trainRequest.current.cancel();
  }, [fetchTrainsData]);

  const handleSelectPreset = (mode: TimeMode, hours: number, minutes: number) => {
    setTimeMode(mode);
    setCustomHours(hours);
    setCustomMinutes(minutes);
  };

  const handleSetLiveClock = () => {
    setTimeMode('live');
    setCurrentDate(new Date());
  };

  const handleSetCustomTime = (hours: number, minutes: number, day: DayOfWeek) => {
    setTimeMode('custom');
    setCustomHours(hours);
    setCustomMinutes(minutes);
    setCustomDay(day);
  };

  const handleStartTrip = (bus: BusTransit) => {
    if (isFetchingTrains || hasFetchError || telemetrySource === 'closed' ||
        !buses.some(t => t.id === bus.id) || !servesJourney(bus, currentStop.id, selectedDestination)) return;
    setActiveTrackingBus(bus);
  };

  const handleTripCompleted = () => {
    if (activeTrackingBus) {
      setCompletedTripBus(activeTrackingBus);
      setActiveTrackingBus(null);
    }
  };

  const handleSplashDone = () => {
    setShowSplash(false);
    // Onboarding is optional: user lands directly into the journey planner!
  };

  return (
    <div className="h-dvh overflow-hidden bg-[#F4F7FA] text-[#1A1C1E] flex flex-col selection:bg-[#0066B2] selection:text-white font-sans antialiased">
      {/* 1. Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <SplashScreen onComplete={handleSplashDone} />
        )}
      </AnimatePresence>

      {/* 2. Onboarding Modal (Optional) */}
      {showOnboarding && !showSplash && (
        <OnboardingModal
          initialProfile={profile}
          currentStop={currentStop}
          destination={selectedDestination}
          onSkip={() => setShowOnboarding(false)}
          onComplete={(updated, newStop, newDest) => {
            setProfile(updated);
            if (newStop) setCurrentStop(newStop);
            if (newDest) setSelectedDestination(newDest);
            setShowOnboarding(false);
            setShowLogin(true);
          }}
        />
      )}

      {/* 3. Login Modal */}
      {showLogin && !showSplash && !showOnboarding && (
        <LoginModal
          currentProfile={profile}
          onLoginSuccess={(updated) => {
            setProfile(updated);
            setShowLogin(false);
          }}
        />
      )}

      {/* Main App Layout */}
      {!showSplash && (
        <>
          {/* Top Sticky Telemetry Bar */}
          <Navbar
            profile={profile}
            currentStopName={currentStop.name}
            simulatedTime={simulatedTime}
            dayName={activeDay}
            isPeakHour={isPeak}
            peakLabel={peakLabel}
            isLiveClock={isLive}
            mlAccuracy={mlHealth?.model_loaded ? mlHealth?.accuracy_score : undefined}
            isModelLoaded={Boolean(mlHealth?.model_loaded)}
            language={language}
            onToggleLanguage={() => setLanguage(l => l === 'en' ? 'ta' : 'en')}
            onOpenProfile={() => setShowProfileModal(true)}
            onOpenTimeModal={() => setShowTimeModal(true)}
            onOpenStationModal={() => setShowStationModal(true)}
            onOpenMLModal={() => setShowMLModal(true)}
          />

          {/* Main Content Area */}
          <main className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 lg:px-8 py-5 w-full">
            <AnimatePresence mode="wait">
              {/* PLAN TAB: Centered around "Which journey should I take?" */}
              {activeTab === 'plan' && (
                <motion.div
                  key="plan-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.18 }}
                >
                  <HomeDashboard
                    buses={buses}
                    currentStop={currentStop}
                    profile={profile}
                    selectedDestination={selectedDestination}
                    simulatedTime={simulatedTime}
                    dayName={activeDay}
                    isPeak={isPeak}
                    peakLabel={peakLabel}
                    language={language}
                    telemetrySource={telemetrySource}
                    lastUpdatedSecondsAgo={secondsAgo}
                    isLoading={isFetchingTrains}
                    isStale={secondsAgo > 60}
                    hasError={hasFetchError}
                    errorMessage={fetchErrorMessage}
                    onRefresh={fetchTrainsData}
                    onOpenTimeModal={() => setShowTimeModal(true)}
                    onOpenStationModal={() => setShowStationModal(true)}
                    onSelectStation={(st) => setCurrentStop(st)}
                    onSelectDestination={setSelectedDestination}
                    onSelectBus={(bus) => {
                      setSelectedBusId(bus.id);
                    }}
                    onOpenBoardingEngine={(busId) => {
                      if (busId) setSelectedBusId(busId);
                      setShowSandboxModal(true);
                    }}
                    onOpenSmartCoach={() => setActiveTab('mytrip')}
                    onOpenCrowdDNA={() => setActiveTab('trends')}
                    onOpenMetroMap={() => setActiveTab('map')}
                    onStartTrip={handleStartTrip}
                  />
                </motion.div>
              )}

              {/* MAP TAB: Lazy-Loaded Chennai Metro Network Map */}
              {activeTab === 'map' && (
                <motion.div
                  key="map-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.18 }}
                >
                  <Suspense fallback={<ViewLoader label="Loading your journey route" />}>
                    <MetroNetworkMap
                      currentStop={currentStop}
                      destination={selectedDestination}
                      buses={buses}
                      onSelectStation={(st) => setCurrentStop(st)}
                      onSelectDestination={setSelectedDestination}
                      onOpenBoardingEngine={(busId) => {
                        if (busId) setSelectedBusId(busId);
                        setShowSandboxModal(true);
                      }}
                      onOpenSmartCoach={() => setActiveTab('mytrip')}
                    />
                  </Suspense>
                </motion.div>
              )}

              {/* MY TRIP TAB: Lazy-Loaded Smart Coach & Live Commuter Assistant */}
              {activeTab === 'mytrip' && (
                <motion.div
                  key="mytrip-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.18 }}
                >
                  <Suspense fallback={<ViewLoader label="Loading Smart Coach Guidance" />}>
                    <SmartCoach
                      buses={buses}
                      currentStop={currentStop}
                      profile={profile}
                      destination={selectedDestination}
                      telemetrySource={telemetrySource}
                      isLoading={isFetchingTrains}
                      onStartTrip={handleStartTrip}
                      onOpenStationModal={() => setShowStationModal(true)}
                    />
                  </Suspense>
                </motion.div>
              )}

              {/* CROWD TRENDS TAB: Lazy-Loaded Crowd DNA Heatmap */}
              {activeTab === 'trends' && (
                <motion.div
                  key="trends-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-6"
                >
                  <Suspense fallback={<ViewLoader label="Loading Chennai Crowd DNA Historical Patterns" />}>
                    <CrowdDNA
                      currentRouteNumber={buses.find(b => b.id === selectedBusId)?.routeNumber || 'BL-104'}
                      currentStationName={currentStop.name}
                      activeDayName={activeDay}
                      activeTimeFormatted={simulatedTime}
                      onSelectTimeSlot={(h, m, d) => {
                        handleSetCustomTime(h, m, d);
                      }}
                    />
                  </Suspense>
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Bottom Commuter Navigation Bar */}
          <BottomNav
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            activeTripCount={activeTrackingBus ? 1 : 0}
            language={language}
          />
        </>
      )}

      {/* Live Active Trip Tracking Modal */}
      {activeTrackingBus && (
        <LiveTrackingModal
          bus={activeTrackingBus}
          currentStop={currentStop}
          destination={selectedDestination}
          profile={profile}
          onClose={() => setActiveTrackingBus(null)}
          onTripCompleted={handleTripCompleted}
        />
      )}

      {/* Trip Completed & Feedback Modal */}
      {completedTripBus && (
        <TripCompletedModal
          bus={completedTripBus}
          currentStop={currentStop}
          profile={profile}
          onClose={() => setCompletedTripBus(null)}
          onFeedbackSubmitted={(updated) => {
            setProfile(updated);
          }}
        />
      )}

      {/* Commuter Profile & Settings Modal */}
      {showProfileModal && (
        <ProfileModal
          profile={profile}
          onClose={() => setShowProfileModal(false)}
          onUpdateProfile={setProfile}
          onOpenCrowdDNA={() => {
            setShowProfileModal(false);
            setActiveTab('trends');
          }}
        />
      )}

      {/* Time & Schedule Controller Modal */}
      {showTimeModal && (
        <TimeControllerModal
          currentMode={timeMode}
          currentDate={currentDate}
          dayName={activeDay}
          hours={activeHours}
          minutes={activeMinutes}
          isPeak={isPeak}
          peakLabel={peakLabel}
          onClose={() => setShowTimeModal(false)}
          onSelectPreset={handleSelectPreset}
          onSetLiveClock={handleSetLiveClock}
          onSetCustomTime={handleSetCustomTime}
        />
      )}

      {/* Station Selector Modal */}
      {showStationModal && (
        <StationSelectModal
          currentStation={currentStop}
          currentStop={currentStop}
          onClose={() => setShowStationModal(false)}
          onSelectStation={(station) => {
            setCurrentStop(station);
            setShowStationModal(false);
          }}
        />
      )}

      {/* Admin ML Diagnostics & Retraining Modal (Decoupled Admin Tooling) */}
      {showMLModal && (
        <Suspense fallback={<div />}>
          <MLDiagnosticsModal
            onHealthChanged={setMlHealth}
            isOpen={showMLModal}
            onClose={() => setShowMLModal(false)}
            currentStationName={currentStop.name}
          />
        </Suspense>
      )}

      {/* Optional ML Sandbox Modal */}
      {showSandboxModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl relative">
            <button
              onClick={() => setShowSandboxModal(false)}
              className="absolute top-4 right-4 text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
            >
              Close ✕
            </button>
            <Suspense fallback={<ViewLoader label="Loading Sandbox" />}>
              <BoardingProbabilityEngine
                buses={buses}
                selectedBusId={selectedBusId}
                activeHours={activeHours}
                activeMinutes={activeMinutes}
                telemetrySource={telemetrySource}
                currentStop={currentStop}
                profile={profile}
                onSelectBus={(bus) => setSelectedBusId(bus.id)}
                onStartTrip={(bus) => {
                  setShowSandboxModal(false);
                  handleStartTrip(bus);
                }}
                onOpenSmartCoach={() => {
                  setShowSandboxModal(false);
                  setActiveTab('mytrip');
                }}
                onOpenStationModal={() => {
                  setShowSandboxModal(false);
                  setShowStationModal(true);
                }}
                onSelectStation={(st) => setCurrentStop(st)}
              />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}
