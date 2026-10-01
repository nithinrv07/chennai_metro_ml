import React from 'react';
import { TrainFront, MapPin, Clock, Zap, Sparkles, UserCheck, CreditCard, ChevronDown, Radio, Cpu } from 'lucide-react';
import { UserProfile } from '../types';
import { DayOfWeek, TimeMode } from '../utils/timeManager';

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
  onOpenProfile,
  onOpenTimeModal,
  onOpenStationModal,
  onOpenMLModal,
}) => {
  return (
    <header id="main-navbar" className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 lg:px-8 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-[#0066B2] to-[#004b85] rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-black text-lg">
            <TrainFront className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 leading-none">
              <span className="font-extrabold text-base tracking-tight text-slate-900 font-heading">
                Chennai <span className="text-[#0066B2]">Metro</span>
              </span>
              <span className="px-2 py-0.5 bg-blue-50 text-[#0066B2] text-[10px] font-extrabold rounded-full uppercase tracking-wider border border-blue-200/80">
                CMRL AI
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline-block mt-0.5">
              Boarding Probability Engine & Smart Coach
            </span>
          </div>
        </div>

        {/* Live Stop & Time Simulation Bar */}
        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          {/* Current Stop - Clickable to change station */}
          <button
            id="station-selector-btn"
            onClick={onOpenStationModal}
            title="Click to switch your current Chennai Metro station"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 text-xs text-slate-700 whitespace-nowrap transition-all shadow-xs group cursor-pointer active:scale-98"
          >
            <div className="w-2 h-2 rounded-full bg-[#0066B2] ring-2 ring-blue-300 animate-pulse shrink-0" />
            <MapPin className="w-3.5 h-3.5 text-[#0066B2] shrink-0 group-hover:scale-110 transition-transform" />
            <div className="text-left leading-tight">
              <span className="text-[9px] text-slate-400 group-hover:text-[#0066B2] uppercase font-bold block transition-colors">
                Station
              </span>
              <span className="font-bold text-slate-900 truncate max-w-[110px] sm:max-w-[170px] inline-block">
                {currentStopName.replace(' Metro Station', '').replace(' Station', '')}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-[#0066B2] ml-0.5 transition-transform" />
          </button>

          {/* Time & Peak Indicator */}
          <button
            id="time-sim-toggle"
            onClick={onOpenTimeModal}
            title="Click to adjust time, switch between Live Clock and CMRL Rush/Optimal Presets"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs whitespace-nowrap transition-all shadow-xs group hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
              isPeakHour
                ? 'bg-amber-50/80 border-amber-200 text-amber-900 hover:bg-amber-100/90'
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-900 hover:bg-emerald-100/90'
            }`}
          >
            {isLiveClock ? (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
            ) : (
              <Clock className="w-3.5 h-3.5 shrink-0 text-slate-600" />
            )}
            <span className="font-mono font-bold tracking-tight">{simulatedTime}</span>
            <span className="text-[10px] text-slate-500 hidden md:inline font-medium">({dayName.slice(0, 3)})</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wide ${
              isPeakHour ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
            }`}>
              {isPeakHour ? 'Rush Peak' : 'Optimal'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-transform" />
          </button>

          {/* ML Active Engine Badge */}
          <button
            id="navbar-ml-status-btn"
            onClick={onOpenMLModal}
            title={isModelLoaded ? "Click to view Scikit-Learn Model Telemetry & Playground" : "ML backend offline (Gateway Fallback Mode)"}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer active:scale-98 ${
              isModelLoaded
                ? 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200 text-cyan-950'
                : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-950'
            }`}
          >
            <span className="flex h-2 w-2 relative shrink-0">
              {isModelLoaded ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-600" />
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              )}
            </span>
            <Cpu className={`w-3.5 h-3.5 shrink-0 ${isModelLoaded ? 'text-cyan-700' : 'text-amber-700'}`} />
            <span className="hidden sm:inline font-mono">ML:</span>
            <span className={`font-mono ${isModelLoaded ? 'text-cyan-800' : 'text-amber-800'}`}>
              {isModelLoaded ? (mlAccuracy ? `${(mlAccuracy * 100).toFixed(1)}%` : '89.3%') : 'Offline'}
            </span>
          </button>
        </div>

        {/* Profile & Singara NCMC Pill */}
        <button
          id="navbar-profile-btn"
          onClick={onOpenProfile}
          className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition-all shrink-0 shadow-xs active:scale-98"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0066B2] to-[#004b85] text-white font-black text-xs flex items-center justify-center shadow-xs">
            {profile.name.charAt(0)}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[100px]">
              {profile.name}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold font-mono">
              <CreditCard className="w-2.5 h-2.5" />
              <span>{profile.singaraCardBalance || '₹340.00'}</span>
            </div>
          </div>
        </button>
      </div>
    </header>
  );
};
