import React from 'react';
import { TrainFront, MapPin, Clock, ShieldCheck, CreditCard, ChevronDown, Cpu, Globe, SlidersHorizontal } from 'lucide-react';
import { UserProfile, Language } from '../types';
import { DayOfWeek } from '../utils/timeManager';
import { translations } from '../utils/translations';

interface NavbarProps {
  profile: UserProfile;
  currentStopName: string;
  simulatedTime: string;
  dayName: DayOfWeek;
  isPeakHour: boolean;
  peakLabel: string;
  isLiveClock: boolean;
  mlAccuracy?: number;
  isModelLoaded?: boolean;
  language?: Language;
  onToggleLanguage?: () => void;
  onOpenProfile: () => void;
  onOpenTimeModal: () => void;
  onOpenStationModal?: () => void;
  onOpenMLModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  currentStopName,
  simulatedTime,
  dayName,
  isPeakHour,
  peakLabel,
  isLiveClock,
  mlAccuracy,
  isModelLoaded,
  language = 'en',
  onToggleLanguage,
  onOpenProfile,
  onOpenTimeModal,
  onOpenStationModal,
  onOpenMLModal,
}) => {
  const t = translations[language];
  const isTa = language === 'ta';

  return (
    <header 
      id="main-navbar" 
      role="banner"
      aria-label="Chennai Metro Navigation Header"
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-3 sm:px-6 lg:px-8 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
    >
      <div className="w-full flex items-center justify-between gap-2 sm:gap-3">
        {/* Brand Logo & Commuter Tagline */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-[#0066B2] to-[#004b85] rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-black text-lg">
            <TrainFront className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2 leading-none">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 font-heading">
                {isTa ? 'சென்னை' : 'Chennai'} <span className="text-[#0066B2]">{isTa ? 'மெட்ரோ' : 'Metro'}</span>
              </span>
              <span className="px-1.5 py-0.5 bg-blue-50 text-[#0066B2] text-[9px] font-extrabold rounded-md uppercase tracking-wider border border-blue-200/80">
                CMRL AI
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium hidden sm:inline-block mt-0.5">
              {t.tagline}
            </span>
          </div>
        </div>

        {/* Live Station & Time Simulation Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-0.5">
          {/* Current Stop - Clickable to switch station */}
          <button
            id="station-selector-btn"
            onClick={onOpenStationModal}
            title={isTa ? "நிலையத்தை மாற்றுக" : "Click to switch your current Chennai Metro station"}
            aria-label={`Current Station: ${currentStopName}`}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 text-xs text-slate-700 whitespace-nowrap transition-all shadow-2xs group cursor-pointer active:scale-98"
          >
            <div className="w-2 h-2 rounded-full bg-[#0066B2] ring-2 ring-blue-300 animate-pulse shrink-0" />
            <MapPin className="w-3.5 h-3.5 text-[#0066B2] shrink-0 group-hover:scale-110 transition-transform" />
            <div className="text-left leading-tight">
              <span className="text-[8px] sm:text-[9px] text-slate-400 group-hover:text-[#0066B2] uppercase font-bold block transition-colors">
                {isTa ? 'நிலையம்' : 'Station'}
              </span>
              <span className="font-bold text-slate-900 truncate max-w-[85px] sm:max-w-[140px] inline-block text-[11px] sm:text-xs">
                {currentStopName.replace(' Metro Station', '').replace(' Station', '')}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-[#0066B2] ml-0.5 transition-transform" />
          </button>

          {/* Time & Peak Indicator */}
          <button
            id="time-sim-toggle"
            onClick={onOpenTimeModal}
            title={isTa ? "நேரத்தை மாற்றுக" : "Adjust time between Live Clock and CMRL Rush/Optimal Presets"}
            aria-label={`Time: ${simulatedTime}, ${peakLabel}`}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs whitespace-nowrap transition-all shadow-2xs group cursor-pointer ${
              isPeakHour
                ? 'bg-amber-50/80 border-amber-200 text-amber-900 hover:bg-amber-100/90'
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-900 hover:bg-emerald-100/90'
            }`}
          >
            {isLiveClock ? (
              <span className="flex h-2 w-2 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
            ) : (
              <Clock className="w-3.5 h-3.5 shrink-0 text-slate-600" />
            )}
            <span className="font-mono font-bold tracking-tight text-[11px] sm:text-xs">{simulatedTime}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide hidden sm:inline ${
              isPeakHour ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
            }`}>
              {isPeakHour ? 'Peak' : 'Opt'}
            </span>
          </button>
        </div>

        {/* Right Action Icons: Language Toggle, Admin ML Ops, Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Bilingual Language Switcher Toggle */}
          {onToggleLanguage && (
            <button
              id="language-switcher-btn"
              onClick={onToggleLanguage}
              title={isTa ? "Switch to English" : "தமிழுக்கு மாற்றவும்"}
              aria-label="Switch language between English and Tamil"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-xs font-bold text-slate-700 transition-all cursor-pointer active:scale-95 shadow-2xs"
            >
              <Globe className="w-3.5 h-3.5 text-[#0066B2]" />
              <span className="font-bold text-[11px]">
                {isTa ? 'English' : 'தமிழ்'}
              </span>
            </button>
          )}

          {/* Admin ML Operations Button (Decoupled Admin Tooling) */}
          <button
            id="navbar-admin-ml-btn"
            onClick={onOpenMLModal}
            title={isTa ? "நிர்வாக AI & மாதிரி பயிற்சி கட்டுப்பாட்டகம்" : "Admin View: Scikit-Learn Model Telemetry, Retraining & Diagnostics"}
            aria-label="Admin ML Operations and Retraining"
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <Cpu className="w-3.5 h-3.5 text-[#0066B2] shrink-0" />
            <span className="hidden md:inline font-mono text-[11px]">
              {isTa ? 'AI நிர்வாகம்' : 'Admin ML'}
            </span>
            {isModelLoaded && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>

          {/* Profile & Singara NCMC Pill */}
          <button
            id="navbar-profile-btn"
            onClick={onOpenProfile}
            aria-label={`Profile: ${profile.name}`}
            className="flex items-center gap-1.5 sm:gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition-all shrink-0 shadow-2xs active:scale-98 cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0066B2] to-[#004b85] text-white font-black text-xs flex items-center justify-center shadow-2xs">
              {profile.name.charAt(0)}
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-[11px] font-bold text-slate-900 leading-tight truncate max-w-[85px]">
                {profile.name.split(' ')[0]}
              </div>
              <div className="flex items-center gap-1 text-[9px] text-emerald-600 font-bold font-mono">
                <CreditCard className="w-2.5 h-2.5" />
                <span>{profile.singaraCardBalance || '₹340'}</span>
              </div>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
