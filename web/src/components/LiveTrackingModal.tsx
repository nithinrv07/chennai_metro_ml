import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrainFront, MapPin, Clock, Users, CheckCircle2, 
  ArrowRight, ShieldCheck, Zap, AlertCircle, X, Compass,
  Layers, CreditCard
} from 'lucide-react';
import { BusTransit, RouteStop, UserProfile } from '../types';

interface LiveTrackingModalProps {
  bus: BusTransit;
  currentStop: RouteStop;
  destination: string;
  profile: UserProfile;
  onClose: () => void;
  onTripCompleted: () => void;
}

export const LiveTrackingModal: React.FC<LiveTrackingModalProps> = ({
  bus,
  currentStop,
  destination,
  profile,
  onClose,
  onTripCompleted,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(bus.arrivalMinutes * 60);
  const [currentProgress, setCurrentProgress] = useState<number>(20);
  const [isOnboard, setIsOnboard] = useState<boolean>(false);
  const [liveCapacity, setLiveCapacity] = useState<number>(bus.capacityPercentage);

  // Simulated live telemetry ticking
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setIsOnboard(true);
          return 0;
        }
        return prev - 1;
      });

      setCurrentProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 1.2;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div id="live-tracking-modal-overlay" className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white border border-slate-200/90 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0066B2]" />
          </span>
          <span className="text-xs font-bold text-[#0066B2] uppercase tracking-wider font-mono">
            {isOnboard ? 'In-Transit CMRL Live Telemetry' : 'Train Inbound • Platform Screen Door Tracking'}
          </span>
        </div>

        {/* Train Title & Route */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0066B2] font-black text-2xl font-mono shadow-xs font-heading">
              {bus.routeNumber}
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 leading-tight font-heading">{bus.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Corridor to <strong className="text-slate-800">{destination}</strong>
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider">
              {isOnboard ? 'Trip Progress' : 'Expected Arrival'}
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600">
              {isOnboard ? `${Math.round(currentProgress)}%` : (bus.realArrivalTime || formatTime(secondsRemaining))}
            </div>
            {!isOnboard && (
              <div className="text-[10px] font-mono text-slate-400 font-bold">
                ({formatTime(secondsRemaining)} remaining)
              </div>
            )}
          </div>
        </div>

        {/* Animated Live Route Progress Bar */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-5">
          <div className="flex justify-between text-xs text-slate-500 font-semibold mb-2">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {currentStop.name.split(' ')[0]}
            </span>
            <span className="flex items-center gap-1 text-[#0066B2] font-bold">
              <Compass className="w-3.5 h-3.5" />
              {destination.split(' ')[0]}
            </span>
          </div>

          {/* Transit track */}
          <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden p-0.5">
            <motion.div
              className="h-full bg-[#0066B2] rounded-full"
              style={{ width: `${currentProgress}%` }}
              transition={{ ease: 'linear' }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-mono">
            <span>Platform: {bus.platformNumber || 'Platform 2'}</span>
            <span className="font-bold text-slate-700">Train Speed: 72 km/h</span>
          </div>
        </div>

        {/* Live Onboard Sensor Stats */}
        <div className="grid grid-cols-3 gap-2.5 mb-5 text-center">
          <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Rake Load</div>
            <div className="text-sm font-black text-slate-900 font-mono">{liveCapacity}% Full</div>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Coach 4 Aisle</div>
            <div className="text-sm font-black text-emerald-600 font-bold">Clear (Rear)</div>
          </div>
          <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Climate / AC</div>
            <div className="text-sm font-black text-[#0066B2]">{bus.acStatus}</div>
          </div>
        </div>

        {/* Smart Coach Live Alert during trip */}
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-start gap-3 mb-6">
          <Zap className="w-4 h-4 text-[#0066B2] shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700">
            <strong className="text-slate-900 block mb-0.5 font-bold">CMRL Smart Coach Staging:</strong>
            {isOnboard
              ? `You're safely onboard Chennai Metro Train ${bus.routeNumber}! Stand near left-side doors at ${destination} for direct escalator exit.`
              : `Train ${bus.routeNumber} is decelerating into ${currentStop.name.split(' ')[0]} platform. Stand at Door Marker 14–16 for Coach 4 (Rear Car).`}
          </div>
        </div>

        {/* Action Button */}
        <button
          id="confirm-trip-complete-btn"
          onClick={onTripCompleted}
          className="w-full py-3.5 px-4 rounded-2xl bg-[#0066B2] hover:bg-blue-700 text-white font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20 active:scale-[0.99] cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          {isOnboard ? 'Arrived at Destination • Tap Out & Complete' : 'Boarded Metro Train • Mark Onboard & Complete'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
};
