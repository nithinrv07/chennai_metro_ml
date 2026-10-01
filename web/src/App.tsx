/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Navbar } from './components/Navbar';
import { BottomNav, NavTab } from './components/BottomNav';
import { SplashScreen } from './components/SplashScreen';
import { OnboardingModal } from './components/OnboardingModal';
import { LoginModal } from './components/LoginModal';
import { HomeDashboard } from './components/HomeDashboard';
import { BoardingProbabilityEngine } from './components/BoardingProbabilityEngine';
import { SmartCoach } from './components/SmartCoach';
import { CrowdDNA } from './components/CrowdDNA';
import { MetroNetworkMap } from './components/MetroNetworkMap';
import { LiveTrackingModal } from './components/LiveTrackingModal';
import { TripCompletedModal } from './components/TripCompletedModal';
import { ProfileModal } from './components/ProfileModal';
import { TimeControllerModal } from './components/TimeControllerModal';
import { StationSelectModal } from './components/StationSelectModal';
import { MLDiagnosticsModal } from './components/MLDiagnosticsModal';
import { INITIAL_BUSES, ALL_METRO_STATIONS, NEARBY_STOPS, INITIAL_PROFILE } from './data/transitData';
import { BusTransit, UserProfile, RouteStop } from './types';
import { fetchMLHealth, fetchMLTrains, MLHealthResponse } from './utils/mlApi';
import { 
  TimeMode, DayOfWeek, formatTime12h, getDayName, 
  evaluatePeakStatus, getRecalculatedTrains, computeRealArrivalTime 
} from './utils/timeManager';

export default function App() {
  // App Lifecycle States
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showLogin, setShowLogin] = useState<boolean>(false);
  
  // Navigation & View States
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [selectedBusId, setSelectedBusId] = useState<string>(INITIAL_BUSES[0].id);
  const [selectedDestination, setSelectedDestination] = useState<string>('Puratchi Thalaivar Dr. M.G.R Central');
  const [currentStop, setCurrentStop] = useState<RouteStop>(ALL_METRO_STATIONS[0] || NEARBY_STOPS[0]);
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [buses, setBuses] = useState<BusTransit[]>(INITIAL_BUSES);

  // Active Trip & Modal States
  const [activeTrackingBus, setActiveTrackingBus] = useState<BusTransit | null>(null);
  const [completedTripBus, setCompletedTripBus] = useState<BusTransit | null>(null);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showTimeModal, setShowTimeModal] = useState<boolean>(false);
  const [showStationModal, setShowStationModal] = useState<boolean>(false);
  const [showMLModal, setShowMLModal] = useState<boolean>(false);
  const [mlHealth, setMlHealth] = useState<MLHealthResponse | null>(null);

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

  // Derive active time values
  const isLive = timeMode === 'live';
  const activeHours = isLive ? currentDate.getHours() : customHours;
  const activeMinutes = isLive ? currentDate.getMinutes() : customMinutes;
  const activeDay = isLive ? getDayName(currentDate.getDay()) : customDay;

  const { isPeak, peakLabel } = evaluatePeakStatus(activeHours, activeMinutes, activeDay);
  const simulatedTime = formatTime12h(activeHours, activeMinutes);

  // Check ML Service health on mount
  useEffect(() => {
    fetchMLHealth().then((data) => {
      if (data) setMlHealth(data);
    });
  }, []);

  // Dynamically recalculate train occupancy, headways & boarding odds on time/station change
  useEffect(() => {
    // 1. Instant local optimistic calculation
    const updated = getRecalculatedTrains(activeHours, activeMinutes, activeDay, currentStop);
    setBuses(updated);

    // 2. Fetch live ML inference from Scikit-Learn backend
    let isCancelled = false;
    const isWeekend = activeDay === 'Saturday' || activeDay === 'Sunday';
    fetchMLTrains(
      currentStop.name,
      selectedDestination,
      activeHours,
      activeMinutes,
      activeDay,
      isWeekend,
      isPeak
    ).then((mlResult) => {
      if (!isCancelled && mlResult?.trains && mlResult.trains.length > 0) {
        const enriched = mlResult.trains.map((t) => ({
          ...t,
          realArrivalTime: t.realArrivalTime || computeRealArrivalTime(activeHours, activeMinutes, t.arrivalMinutes),
        }));
        setBuses(enriched);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [activeHours, activeMinutes, activeDay, currentStop, selectedDestination, isPeak]);

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
    setShowOnboarding(true);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FA] text-[#1A1C1E] flex flex-col selection:bg-[#0066B2] selection:text-white font-sans antialiased">
      {/* 1. Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <SplashScreen onComplete={handleSplashDone} />
        )}
      </AnimatePresence>

      {/* 2. Onboarding Modal */}
      {showOnboarding && !showSplash && (
        <OnboardingModal
          initialProfile={profile}
          currentStop={currentStop}
          destination={selectedDestination}
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
            mlAccuracy={mlHealth?.accuracy_score}
            onOpenProfile={() => setShowProfileModal(true)}
            onOpenTimeModal={() => setShowTimeModal(true)}
            onOpenStationModal={() => setShowStationModal(true)}
            onOpenMLModal={() => setShowMLModal(true)}
          />

          {/* Main Content Area */}
          <main className="flex-1 px-4 py-5 max-w-5xl mx-auto w-full">
            <AnimatePresence mode="wait">
              {activeTab === 'home' && (
                <motion.div
                  key="home-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
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
                    onOpenTimeModal={() => setShowTimeModal(true)}
                    onOpenStationModal={() => setShowStationModal(true)}
                    onSelectStation={(st) => setCurrentStop(st)}
                    onSelectDestination={setSelectedDestination}
                    onSelectBus={(bus) => {
                      setSelectedBusId(bus.id);
                      setActiveTab('engine');
                    }}
                    onOpenBoardingEngine={(busId) => {
                      if (busId) setSelectedBusId(busId);
                      setActiveTab('engine');
                    }}
                    onOpenSmartCoach={() => setActiveTab('coach')}
                    onOpenCrowdDNA={() => setActiveTab('profile')}
                    onOpenMetroMap={() => setActiveTab('network')}
                    onStartTrip={handleStartTrip}
                  />
                </motion.div>
              )}

              {activeTab === 'network' && (
                <motion.div
                  key="network-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <MetroNetworkMap
                    currentStop={currentStop}
                    destination={selectedDestination}
                    buses={buses}
                    onSelectStation={(st) => setCurrentStop(st)}
                    onSelectDestination={setSelectedDestination}
                    onOpenBoardingEngine={(busId) => {
                      if (busId) setSelectedBusId(busId);
                      setActiveTab('engine');
                    }}
                    onOpenSmartCoach={() => setActiveTab('coach')}
                  />
                </motion.div>
              )}

              {activeTab === 'engine' && (
                <motion.div
                  key="engine-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <BoardingProbabilityEngine
                    buses={buses}
                    selectedBusId={selectedBusId}
                    currentStop={currentStop}
                    profile={profile}
                    onSelectBus={(bus) => setSelectedBusId(bus.id)}
                    onStartTrip={handleStartTrip}
                    onOpenSmartCoach={() => setActiveTab('coach')}
                    onOpenStationModal={() => setShowStationModal(true)}
                    onSelectStation={(st) => setCurrentStop(st)}
                  />
                </motion.div>
              )}

              {activeTab === 'coach' && (
                <motion.div
                  key="coach-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <SmartCoach
                    buses={buses}
                    currentStop={currentStop}
                    profile={profile}
                    destination={selectedDestination}
                    onStartTrip={handleStartTrip}
                    onOpenStationModal={() => setShowStationModal(true)}
                  />
                </motion.div>
              )}

              {activeTab === 'profile' && (
                <motion.div
                  key="profile-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <CrowdDNA
                    currentRouteNumber={buses.find(b => b.id === selectedBusId)?.routeNumber || 'BL-104'}
                    currentStationName={currentStop.name}
                    activeDayName={activeDay}
                    activeTimeFormatted={simulatedTime}
                    onSelectTimeSlot={(h, m, d) => {
                      handleSetCustomTime(h, m, d);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Bottom Navigation Bar */}
          <BottomNav
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            coachAlertCount={1}
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

      {/* Trip Completed & Crowd DNA Feedback Modal */}
      {completedTripBus && (
        <TripCompletedModal
          bus={completedTripBus}
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
            setActiveTab('profile');
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

      {/* ML Diagnostics & Playground Modal */}
      {showMLModal && (
        <MLDiagnosticsModal
          isOpen={showMLModal}
          onClose={() => setShowMLModal(false)}
          currentStationName={currentStop.name}
        />
      )}
    </div>
  );
}
