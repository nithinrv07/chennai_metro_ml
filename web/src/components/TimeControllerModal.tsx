import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Clock, Sun, Sparkles, Coffee, Sunset, Moon, 
  Check, RefreshCw, Calendar, X, AlertTriangle, ArrowRight, Zap,
  Activity, Play, CheckCircle2
} from 'lucide-react';
import { TimeMode, DayOfWeek, TIME_PRESETS, formatTime12h } from '../utils/timeManager';

interface TimeControllerModalProps {
  currentMode: TimeMode;
  currentDate: Date;
  dayName: DayOfWeek;
  hours: number;
  minutes: number;
  isPeak: boolean;
  peakLabel: string;
  onClose: () => void;
  onSelectPreset: (mode: TimeMode, hours: number, minutes: number) => void;
  onSetLiveClock: () => void;
  onSetCustomTime: (hours: number, minutes: number, dayName: DayOfWeek) => void;
}

export const TimeControllerModal: React.FC<TimeControllerModalProps> = ({
  currentMode,
  currentDate,
  dayName,
  hours,
  minutes,
  isPeak,
  peakLabel,
  onClose,
  onSelectPreset,
  onSetLiveClock,
  onSetCustomTime,
}) => {
  const [selectedHours, setSelectedHours] = useState<number>(hours);
  const [selectedMinutes, setSelectedMinutes] = useState<number>(minutes);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(dayName);
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');

  const daysList: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const getPresetIcon = (type: string) => {
    switch (type) {
      case 'morning':
        return <Sun className="w-4 h-4 text-amber-500" />;
      case 'optimal':
        return <Sparkles className="w-4 h-4 text-emerald-500" />;
      case 'afternoon':
        return <Coffee className="w-4 h-4 text-blue-500" />;
      case 'evening':
        return <Sunset className="w-4 h-4 text-rose-500" />;
      case 'night':
        return <Moon className="w-4 h-4 text-indigo-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const handleApplyCustom = () => {
    onSetCustomTime(selectedHours, selectedMinutes, selectedDay);
    onClose();
  };

  return (
    <div id="time-controller-overlay" className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white border border-slate-200/90 w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden"
      >
        {/* Close Button */}
        <button
          id="close-time-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-2xl bg-blue-50 text-[#0066B2]">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-[#0066B2] font-bold uppercase tracking-widest block">
              CMRL Temporal Simulator
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight font-heading">
              Metro Time & Rush Controls
            </h2>
          </div>
        </div>

        {/* Current Active Status Banner */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>{formatTime12h(hours, minutes)}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600">{dayName}</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">{peakLabel}</div>
            </div>
          </div>

          <button
            id="sync-live-time-btn"
            onClick={() => {
              onSetLiveClock();
              onClose();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
              currentMode === 'live'
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${currentMode === 'live' ? 'animate-spin' : ''}`} />
            <span>{currentMode === 'live' ? 'Live Clock Active' : 'Sync Live Time'}</span>
          </button>
        </div>

        {/* Tab Switcher: Presets vs Custom Slider */}
        <div className="flex rounded-xl bg-slate-100 p-1 mb-4">
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'presets' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Commute Presets
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'custom' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Custom Time & Day
          </button>
        </div>

        {/* Mode 1: Commute Presets */}
        {activeTab === 'presets' ? (
          <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
            {TIME_PRESETS.map((preset) => {
              const isSelected = currentMode === preset.id;
              return (
                <button
                  key={preset.id}
                  id={`time-preset-${preset.id}`}
                  onClick={() => {
                    onSelectPreset(preset.id, preset.hours, preset.minutes);
                    onClose();
                  }}
                  className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between group cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 border-blue-400 text-blue-950 shadow-xs ring-1 ring-blue-200'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isSelected ? 'bg-[#0066B2] text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {getPresetIcon(preset.iconType)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <span>{preset.label}</span>
                        <span className="font-mono text-[11px] text-[#0066B2] bg-blue-100/60 px-1.5 py-0.2 rounded font-bold">
                          {preset.timeStr}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">{preset.sublabel}</div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isSelected ? (
                      <Check className="w-4 h-4 text-[#0066B2] stroke-[3]" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-transform group-hover:translate-x-0.5" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* Mode 2: Custom Time Slider & Day Picker */
          <div className="space-y-4 pt-1">
            {/* Day of Week Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Day of Week</label>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {daysList.map((d) => {
                  const isSelected = selectedDay === d;
                  return (
                    <button
                      key={d}
                      onClick={() => setSelectedDay(d)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        isSelected
                          ? 'bg-[#0066B2] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {d.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slider */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-700">Departure Time</label>
                <span className="font-mono font-black text-sm text-[#0066B2] bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100">
                  {formatTime12h(selectedHours, selectedMinutes)}
                </span>
              </div>

              {/* Hour Slider (5 AM to 11 PM) */}
              <div className="space-y-2">
                <input
                  type="range"
                  min={5}
                  max={23}
                  value={selectedHours}
                  onChange={(e) => setSelectedHours(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0066B2]"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono font-bold">
                  <span>05:00 AM</span>
                  <span>12:00 PM</span>
                  <span>06:00 PM</span>
                  <span>11:00 PM</span>
                </div>
              </div>

              {/* Minute Quick Toggles */}
              <div className="flex gap-2 mt-3">
                {[0, 15, 30, 45].map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMinutes(m)}
                    className={`flex-1 py-1 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                      selectedMinutes === m
                        ? 'bg-[#0066B2] text-white border-[#0066B2]'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    :{m < 10 ? `0${m}` : m}
                  </button>
                ))}
              </div>
            </div>

            <button
              id="apply-custom-time-btn"
              onClick={handleApplyCustom}
              className="w-full py-3 rounded-2xl bg-[#0066B2] hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20 active:scale-[0.99] mt-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Apply {formatTime12h(selectedHours, selectedMinutes)} & Recalibrate CMRL ML
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
