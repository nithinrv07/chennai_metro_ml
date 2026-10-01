import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrainFront, Zap, Activity, ShieldCheck, ArrowRight, Layers } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 400);
          return 100;
        }
        return prev + 20;
      });
    }, 280);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div id="splash-screen" className="fixed inset-0 z-50 bg-[#F4F7FA] flex flex-col items-center justify-center p-6 text-[#1A1C1E] overflow-hidden">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white border border-gray-200/80 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center relative z-10"
      >
        {/* App Logo & Icon */}
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center relative overflow-hidden shadow-xs">
            <TrainFront className="w-10 h-10 text-[#0066B2]" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 border-2 border-dashed border-blue-300 rounded-full m-2"
            />
          </div>
          <span className="absolute -bottom-1 -right-1 bg-[#0066B2] text-white font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
            <Zap className="w-2.5 h-2.5 fill-current" /> CMRL AI
          </span>
        </div>

        {/* Brand Name & Tagline */}
        <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-1.5">
          Chennai <span className="text-[#0066B2]">Metro</span>
        </h1>
        <p className="text-xs text-gray-500 font-medium max-w-xs mb-6">
          Boarding Probability Prediction Engine • Smart Coach • 4-Car Crowd DNA
        </p>

        {/* Feature Highlights Pills */}
        <div className="grid grid-cols-3 gap-2.5 w-full mb-6">
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 flex flex-col items-center shadow-xs">
            <Activity className="w-4 h-4 text-[#0066B2] mb-1" />
            <span className="text-[11px] font-bold text-gray-800">ML Predictor</span>
            <span className="text-[9px] text-gray-400 font-semibold">91% Accuracy</span>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 flex flex-col items-center shadow-xs">
            <Zap className="w-4 h-4 text-amber-500 mb-1" />
            <span className="text-[11px] font-bold text-gray-800">Smart Coach</span>
            <span className="text-[9px] text-gray-400 font-semibold">Door & Staging</span>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 flex flex-col items-center shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 mb-1" />
            <span className="text-[11px] font-bold text-gray-800">Crowd DNA</span>
            <span className="text-[9px] text-gray-400 font-semibold">Guindy Corridor</span>
          </div>
        </div>

        {/* Progress Bar & Telemetry Status */}
        <div className="w-full bg-gray-100 rounded-full h-2.5 p-0.5 border border-gray-200 mb-3 overflow-hidden">
          <motion.div
            className="h-full bg-[#0066B2] rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ ease: 'easeOut', duration: 0.2 }}
          />
        </div>

        <div className="flex items-center justify-between w-full text-xs text-gray-400 font-semibold">
          <span>Connecting to CMRL AFC & platform telemetry...</span>
          <span className="font-mono text-[#0066B2] font-bold">{progress}%</span>
        </div>

        {/* Manual Skip Button */}
        <button
          id="skip-splash-btn"
          onClick={onComplete}
          className="mt-6 text-xs text-gray-500 hover:text-gray-900 font-bold flex items-center gap-1 transition-colors px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200"
        >
          Enter Metro App <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </div>
  );
};
