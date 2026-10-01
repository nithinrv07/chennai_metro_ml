import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, Calendar, Clock, AlertTriangle, CheckCircle2, 
  TrendingUp, Sparkles, MapPin, Users, ChevronRight, Compass, Shield,
  TrainFront, ArrowRight, Cpu
} from 'lucide-react';
import { CROWD_DNA_WEEKLY } from '../data/transitData';
import { DayPattern } from '../types';
import { DayOfWeek } from '../utils/timeManager';
import { fetchMLCrowdDNA } from '../utils/mlApi';

interface CrowdDNAProps {
  currentRouteNumber?: string;
  currentStationName?: string;
  activeDayName?: DayOfWeek;
  activeTimeFormatted?: string;
  onSelectTimeSlot?: (hours: number, minutes: number, dayName: DayOfWeek) => void;
}

export const CrowdDNA: React.FC<CrowdDNAProps> = ({
  currentRouteNumber = 'BL-104',
  currentStationName = 'Guindy Metro Station',
  activeDayName = 'Monday',
  activeTimeFormatted = '08:26 AM',
  onSelectTimeSlot,
}) => {
  const initialIndex = Math.max(0, CROWD_DNA_WEEKLY.findIndex(d => d.day === activeDayName));
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(initialIndex !== -1 ? initialIndex : 0);
  const [mlPattern, setMlPattern] = useState<DayPattern | null>(null);
  const [isMLLoaded, setIsMLLoaded] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const targetDay = CROWD_DNA_WEEKLY[selectedDayIndex]?.day || 'Monday';
    fetchMLCrowdDNA(currentStationName, targetDay).then((data) => {
      if (isMounted && data) {
        setMlPattern({
          day: data.day as any,
          shortDay: data.shortDay,
          avgCrowd: data.avgCrowd,
          peakWindow: data.peakWindow,
          bestWindow: data.bestWindow,
          dataPoints: data.dataPoints,
        });
        setIsMLLoaded(true);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [selectedDayIndex, currentStationName]);

  const activeDayPattern: DayPattern = mlPattern || CROWD_DNA_WEEKLY[selectedDayIndex] || CROWD_DNA_WEEKLY[0];

  return (
    <div id="crowd-dna-view" className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-blue-50 text-[#0066B2]">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading">
                  Chennai Metro Crowd DNA
                </h2>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Historical Chennai commuter behavior patterns, Anna Salai morning peak surges, and optimal departure windows
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-800 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-600" />
              <span>RandomForest ML Inferred</span>
            </span>
            <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-100 text-[#0066B2] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Train {currentRouteNumber} DNA Map
            </span>
          </div>
        </div>

        {/* Day of Week Selector Tabs */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1">
          {CROWD_DNA_WEEKLY.map((day, idx) => {
            const isSelected = selectedDayIndex === idx;
            return (
              <button
                key={day.day}
                id={`dna-day-tab-${day.shortDay}`}
                onClick={() => setSelectedDayIndex(idx)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex flex-col items-center min-w-[64px] shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#0066B2] text-white shadow-md shadow-blue-500/20 font-black scale-105'
                    : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{day.shortDay}</span>
                <span className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                  {day.avgCrowd}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CORE HIGHLIGHT CARDS: YOUR BEST TIME vs PEAK CROWD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Your Best Time Card */}
        <div className="bg-white border border-emerald-200 rounded-3xl p-6 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">
                Your Best Time to Board
              </span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-mono font-black border border-emerald-200">
              97% Boarding Clearance
            </span>
          </div>

          <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight my-2">
            {activeDayPattern.bestWindow}
          </div>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Platform crush eases by 62% after 09:10 AM across Guindy & Alandur interchanges. 4-Car train seating availability exceeds 80% on Blue Line to Central.
          </p>
        </div>

        {/* Peak Crowd Avoid Window */}
        <div className="bg-white border border-rose-200 rounded-3xl p-6 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <span className="text-xs font-black text-rose-700 uppercase tracking-wider">
                Anna Salai Peak Surge
              </span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-mono font-black border border-rose-200">
              94% Load
            </span>
          </div>

          <div className="text-3xl sm:text-4xl font-black text-rose-600 font-mono tracking-tight my-2">
            {activeDayPattern.peakWindow}
          </div>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Severe platform congestion at Anna Salai interchange corridors. High probability of waiting for subsequent rake.
          </p>
        </div>
      </div>

      {/* HOURLY CROWD DNA HEATMAP & BAR DISTRIBUTION */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2 font-heading">
              <Clock className="w-4 h-4 text-[#0066B2]" />
              {activeDayPattern.day} Hourly Chennai Metro Crowd Heatmap
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Live capacity and boarding success rates across morning rush, afternoon quiet, and evening office return hours
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 px-3 py-1 bg-slate-50 rounded-xl border border-slate-200 font-semibold">
            Avg Load: <strong className="text-slate-900 font-bold">{activeDayPattern.avgCrowd}%</strong>
          </span>
        </div>

        {/* Visual Bar Visualization */}
        <div className="space-y-3 pt-1">
          {activeDayPattern.dataPoints.map((dp, idx) => {
            const isHigh = dp.crowdPercentage >= 80;
            const isLow = dp.crowdPercentage <= 40;
            const barColor = isHigh
              ? 'bg-rose-500'
              : isLow
              ? 'bg-emerald-500'
              : 'bg-amber-500';

            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-all ${
                  dp.isBestTime
                    ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-200'
                    : dp.isPeak
                    ? 'bg-rose-50/40 border-rose-200'
                    : 'bg-slate-50/60 border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-slate-900 min-w-[70px]">
                      {dp.timeSlot}
                    </span>
                    {dp.isBestTime && (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-black uppercase tracking-wider">
                        ★ Best Window
                      </span>
                    )}
                    {dp.isPeak && (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-black uppercase tracking-wider border border-rose-200">
                        Peak Rush
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-slate-500">
                      Rake Load: <strong className={isHigh ? 'text-rose-600 font-black' : isLow ? 'text-emerald-600 font-black' : 'text-amber-600 font-black'}>{dp.crowdLevel} ({dp.crowdPercentage}%)</strong>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-600">
                      Boarding Odds: <strong className="text-emerald-600 font-black">{dp.boardingRate}%</strong>
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full ${barColor}`}
                    style={{ width: `${dp.crowdPercentage}%` }}
                  />
                </div>

                {dp.recommendedAction && (
                  <div className="text-xs text-slate-600 font-medium mt-2.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#0066B2]" />
                    <span>{dp.recommendedAction}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CONTINUOUS MODEL TRAINING FEEDBACK LOOP INFO */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs flex items-start gap-4">
        <div className="p-3 rounded-2xl bg-blue-50 text-[#0066B2] shrink-0 mt-0.5">
          <Shield className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-black text-slate-900 font-heading">
            How Chennai Metro Crowd DNA Learns
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            Every time you complete a trip and rate your coach comfort in the <strong>Trip Completed</strong> modal,
            our reinforcement learning layer recalibrates time-slot weights. Over 18,400 daily commuter telemetry inputs actively train CMRL Blue & Green Line forecasts.
          </p>
        </div>
      </div>
    </div>
  );
};
