import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CommuterPersona, PriorityPreference, UserProfile, RouteStop } from '../types';
import { 
  GraduationCap, Briefcase, Moon, Compass, 
  Target, Zap, Armchair, Footprints,
  MapPin, Bell, Shield, Check, ArrowRight, ArrowLeft,
  TrainFront, CreditCard, Search, ArrowLeftRight, CheckCircle2
} from 'lucide-react';
import { ALL_METRO_STATIONS, POPULAR_DESTINATIONS } from '../data/transitData';

interface OnboardingModalProps {
  initialProfile: UserProfile;
  currentStop?: RouteStop;
  destination?: string;
  onComplete: (updatedProfile: UserProfile, selectedStop?: RouteStop, destination?: string) => void;
  onSkip?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ 
  initialProfile, 
  currentStop = ALL_METRO_STATIONS[0],
  destination = 'Puratchi Thalaivar Dr. M.G.R Central',
  onComplete,
  onSkip,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [persona, setPersona] = useState<CommuterPersona>(initialProfile.persona);
  const [preference, setPreference] = useState<PriorityPreference>(initialProfile.preference);
  const [selectedOrigin, setSelectedOrigin] = useState<RouteStop>(currentStop);
  const [selectedDest, setSelectedDest] = useState<string>(destination);
  const [originSearch, setOriginSearch] = useState<string>('');
  const [destSearch, setDestSearch] = useState<string>('');
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const personas = [
    {
      id: 'student' as CommuterPersona,
      title: 'College / Student',
      description: 'Anna University, IIT Madras & Guindy colleges. Fast boarding for morning exams.',
      icon: GraduationCap,
      color: 'emerald',
    },
    {
      id: 'commuter' as CommuterPersona,
      title: 'OMR / IT Commuter',
      description: 'Anna Salai & OMR IT corridor rush (8:30 AM / 6:00 PM). Values low crowd predictability.',
      icon: Briefcase,
      color: 'blue',
    },
    {
      id: 'shift' as CommuterPersona,
      title: 'Airport / Shift Specialist',
      description: 'Direct airport luggage runs & late night Chennai Central trains.',
      icon: Moon,
      color: 'indigo',
    },
    {
      id: 'explorer' as CommuterPersona,
      title: 'Chennai Explorer',
      description: 'Marina Beach, Central heritage & shopping visits across Blue & Green lines.',
      icon: Compass,
      color: 'teal',
    },
  ];

  const preferences = [
    {
      id: 'highest_probability' as PriorityPreference,
      title: 'Highest Boarding Probability',
      description: 'Never miss a train or get stuck behind platform gate crush (Default)',
      icon: Target,
      highlight: 'CMRL AI Recommended',
    },
    {
      id: 'fastest_travel' as PriorityPreference,
      title: 'Fastest Travel Time',
      description: 'Prioritizes immediate departure even if middle coach is crowded',
      icon: Zap,
    },
    {
      id: 'guaranteed_seat' as PriorityPreference,
      title: 'Guaranteed Comfort & Seating',
      description: 'Prefers coach 4 (rear) or waiting for an originating empty train rake',
      icon: Armchair,
    },
    {
      id: 'min_walking' as PriorityPreference,
      title: 'Direct Platform / Minimum Walk',
      description: 'Nearest Guindy entry escalator and direct door staging',
      icon: Footprints,
    },
  ];

  const handleSwapStations = () => {
    // If destination matches any metro station, swap
    const foundDestStop = ALL_METRO_STATIONS.find(s => s.name.includes(selectedDest.split(' ')[0]));
    if (foundDestStop) {
      const oldOrigin = selectedOrigin;
      setSelectedOrigin(foundDestStop);
      setSelectedDest(oldOrigin.name);
    } else {
      const oldName = selectedOrigin.name;
      setSelectedDest(oldName);
      setSelectedOrigin(ALL_METRO_STATIONS[1] || ALL_METRO_STATIONS[0]);
    }
  };

  const handleFinish = () => {
    onComplete({
      ...initialProfile,
      persona,
      preference,
      homeStop: selectedOrigin.name,
      primaryDestination: selectedDest,
      gpsEnabled,
      notificationsEnabled,
    }, selectedOrigin, selectedDest);
  };

  const filteredOriginStations = ALL_METRO_STATIONS.filter(s => 
    s.name.toLowerCase().includes(originSearch.toLowerCase()) ||
    (s.tamilName && s.tamilName.includes(originSearch))
  );

  const filteredDestinations = POPULAR_DESTINATIONS.filter(d =>
    d.name.toLowerCase().includes(destSearch.toLowerCase()) ||
    d.category.toLowerCase().includes(destSearch.toLowerCase())
  );

  return (
    <div id="onboarding-overlay" className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200/80 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-full bg-[#0066B2] text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {step}
            </span>
            <span className="text-sm font-bold text-gray-900">
              {step === 1 ? 'Select Commuter Persona' 
                : step === 2 ? 'Select Origin & Destination' 
                : step === 3 ? 'Commute Priorities' 
                : 'CMRL Platform Telemetry'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-mono font-bold">Step {step} of 4</span>
            {onSkip && (
              <button
                id="skip-onboarding-btn"
                type="button"
                onClick={onSkip}
                className="text-xs font-bold text-[#0066B2] hover:text-blue-700 hover:underline px-2 py-1 rounded cursor-pointer"
              >
                Skip ➔
              </button>
            )}
          </div>
        </div>

        <div className="overflow-y-auto pr-1 flex-1">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-xl font-black text-gray-900 mb-1">How do you travel on Chennai Metro?</h2>
                  <p className="text-xs text-gray-500 font-medium">
                    CMRL Smart Coach customizes coach staging tips, crowd surge alerts, and line recommendations.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {personas.map((p) => {
                    const Icon = p.icon;
                    const isSelected = persona === p.id;
                    return (
                      <button
                        key={p.id}
                        id={`persona-${p.id}`}
                        onClick={() => setPersona(p.id)}
                        className={`p-4 rounded-2xl text-left border transition-all flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-blue-400 text-blue-950 shadow-xs'
                            : 'bg-gray-50/60 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-3">
                          <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-[#0066B2] text-white' : 'bg-gray-200 text-gray-600'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#0066B2] stroke-[2.5]" />}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-gray-900">{p.title}</div>
                          <div className="text-[11px] text-gray-500 leading-tight mt-1">{p.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    id="onboarding-next-1"
                    onClick={() => setStep(2)}
                    className="px-6 py-3 rounded-2xl bg-[#0066B2] hover:bg-blue-700 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Current Station & Destination Selector */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-xl font-black text-gray-900 mb-1">Set Your Current Station & Destination</h2>
                  <p className="text-xs text-gray-500 font-medium">
                    Choose your departure station and target destination on the Chennai Metro Blue & Green lines.
                  </p>
                </div>

                {/* Selected Route Summary Banner with Swap button */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-slate-50 to-blue-50 border border-blue-200/80 shadow-xs relative">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#0066B2] ring-2 ring-blue-200 shrink-0" />
                        <div className="text-xs">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Current Station (Origin)</span>
                          <strong className="text-slate-900 font-bold text-sm">{selectedOrigin.name}</strong>
                        </div>
                      </div>

                      <div className="h-4 border-l-2 border-dashed border-blue-300 ml-1.5" />

                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200 shrink-0" />
                        <div className="text-xs">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Destination</span>
                          <strong className="text-slate-900 font-bold text-sm">{selectedDest}</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSwapStations}
                      title="Swap Origin & Destination"
                      className="p-3 rounded-2xl bg-white border border-blue-200 text-[#0066B2] hover:bg-blue-100 hover:text-blue-900 transition-all shadow-xs shrink-0 cursor-pointer"
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Origin Station Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#0066B2]" /> 1. Select Current Departure Station
                    </label>
                    <span className="text-[10px] font-mono text-slate-500">{filteredOriginStations.length} of {ALL_METRO_STATIONS.length} Stations</span>
                  </div>

                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={originSearch}
                      onChange={(e) => setOriginSearch(e.target.value)}
                      placeholder="Filter origin stations (e.g. Guindy, Airport, Central, Egmore)..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0066B2] focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1 bg-slate-50 rounded-2xl border border-slate-200">
                    {filteredOriginStations.map((station) => {
                      const isSelected = selectedOrigin.id === station.id;
                      return (
                        <button
                          key={station.id}
                          type="button"
                          onClick={() => setSelectedOrigin(station)}
                          className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer text-xs ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-xs'
                              : 'bg-white border-slate-200 text-slate-800 hover:bg-blue-50'
                          }`}
                        >
                          <div className="font-bold truncate">{station.name.split(' ')[0]}</div>
                          <div className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                            {station.interchange ? 'Interchange' : station.linesServing?.[0]?.includes('Green') ? 'Green Line' : 'Blue Line'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Destination Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-emerald-600" /> 2. Select Destination
                    </label>
                    <span className="text-[10px] font-mono text-slate-500">{filteredDestinations.length} Hubs</span>
                  </div>

                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={destSearch}
                      onChange={(e) => setDestSearch(e.target.value)}
                      placeholder="Filter destinations (e.g. Central, Airport, IT Corridor)..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 bg-slate-50 rounded-2xl border border-slate-200">
                    {filteredDestinations.map((dest) => {
                      const isSelected = selectedDest === dest.name;
                      return (
                        <button
                          key={dest.id}
                          type="button"
                          onClick={() => setSelectedDest(dest.name)}
                          className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer text-xs flex items-center justify-between ${
                            isSelected
                              ? 'bg-emerald-600 border-emerald-600 text-white font-bold shadow-xs'
                              : 'bg-white border-slate-200 text-slate-800 hover:bg-emerald-50'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-bold truncate">{dest.name}</div>
                            <div className={`text-[10px] truncate ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                              {dest.category} • {dest.typicalEta}
                            </div>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between">
                  <button
                    id="onboarding-back-2"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <button
                    id="onboarding-next-2"
                    onClick={() => setStep(3)}
                    className="px-6 py-3 rounded-2xl bg-[#0066B2] hover:bg-blue-700 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                  >
                    Confirm Route & Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-xl font-black text-gray-900 mb-1">What matters most on your metro commute?</h2>
                  <p className="text-xs text-gray-500 font-medium">
                    The Boarding Probability Engine weights ML factors according to this preference.
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  {preferences.map((pref) => {
                    const Icon = pref.icon;
                    const isSelected = preference === pref.id;
                    return (
                      <button
                        key={pref.id}
                        id={`pref-${pref.id}`}
                        onClick={() => setPreference(pref.id)}
                        className={`w-full p-3.5 rounded-2xl text-left border transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-blue-400 text-blue-950 shadow-xs'
                            : 'bg-gray-50/60 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-[#0066B2] text-white' : 'bg-gray-200 text-gray-600'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-gray-900">{pref.title}</span>
                              {pref.highlight && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-[#0066B2] font-bold">
                                  {pref.highlight}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500 font-medium">{pref.description}</span>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-[#0066B2] bg-[#0066B2] text-white' : 'border-gray-300'}`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    id="onboarding-back-3"
                    onClick={() => setStep(2)}
                    className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <button
                    id="onboarding-next-3"
                    onClick={() => setStep(4)}
                    className="px-6 py-3 rounded-2xl bg-[#0066B2] hover:bg-blue-700 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-xl font-black text-gray-900 mb-1">Permissions & Telemetry</h2>
                  <p className="text-xs text-gray-500 font-medium">
                    Enable live station platform telemetry to compute accurate boarding clearance and coach recommendations.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-blue-50 text-[#0066B2]">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">Live Station Geolocation</div>
                        <div className="text-xs text-gray-500">Auto-detect nearest metro station ({selectedOrigin.name.split(' ')[0]} Metro)</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      id="gps-toggle"
                      checked={gpsEnabled}
                      onChange={(e) => setGpsEnabled(e.target.checked)}
                      className="w-5 h-5 accent-[#0066B2] rounded cursor-pointer"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-blue-50 text-[#0066B2]">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">CMRL Smart Coach Alerts</div>
                        <div className="text-xs text-gray-500">Notify before morning rush peak (at 8:15 AM)</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      id="notifications-toggle"
                      checked={notificationsEnabled}
                      onChange={(e) => setNotificationsEnabled(e.target.checked)}
                      className="w-5 h-5 accent-[#0066B2] rounded cursor-pointer"
                    />
                  </div>

                  <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100 flex items-start gap-2.5 text-[11px] text-blue-900 font-medium">
                    <Shield className="w-4 h-4 text-[#0066B2] shrink-0 mt-0.5" />
                    <span>Privacy First: Passenger telemetry is fully anonymized to train CMRL Crowd DNA predictive models.</span>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    id="onboarding-back-4"
                    onClick={() => setStep(3)}
                    className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <button
                    id="onboarding-finish-btn"
                    onClick={handleFinish}
                    className="px-6 py-3 rounded-2xl bg-[#0066B2] hover:bg-blue-700 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                  >
                    Enter Chennai Metro App <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

