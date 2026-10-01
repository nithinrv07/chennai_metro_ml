import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User, Sparkles, Target, Zap, Shield, 
  MapPin, Bell, Check, X, Award, BarChart3, Clock, Compass,
  CreditCard, TrainFront, Plus
} from 'lucide-react';
import { UserProfile, CommuterPersona, PriorityPreference } from '../types';

interface ProfileModalProps {
  profile: UserProfile;
  onClose: () => void;
  onUpdateProfile: (updated: UserProfile) => void;
  onOpenCrowdDNA: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  onClose,
  onUpdateProfile,
  onOpenCrowdDNA,
}) => {
  const [recharged, setRecharged] = useState(false);

  const personas: { id: CommuterPersona; label: string }[] = [
    { id: 'commuter', label: 'OMR / IT Commuter' },
    { id: 'student', label: 'College / Student' },
    { id: 'shift', label: 'Airport / Shift Specialist' },
    { id: 'explorer', label: 'Chennai Explorer' },
  ];

  const preferences: { id: PriorityPreference; label: string }[] = [
    { id: 'highest_probability', label: 'Highest Boarding Probability' },
    { id: 'fastest_travel', label: 'Fastest Travel Time' },
    { id: 'guaranteed_seat', label: 'Guaranteed Comfort & Coach Seating' },
    { id: 'min_walking', label: 'Minimum Platform Walk' },
  ];

  const handleQuickRecharge = () => {
    const currentNum = parseInt((profile.singaraCardBalance || '₹340').replace('₹', '').replace('.00', ''), 10) || 340;
    const newBal = `₹${currentNum + 100}.00`;
    onUpdateProfile({
      ...profile,
      singaraCardBalance: newBal,
      xpPoints: profile.xpPoints + 20,
    });
    setRecharged(true);
    setTimeout(() => setRecharged(false), 2000);
  };

  return (
    <div id="profile-modal-overlay" className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border border-slate-200/90 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Profile Card Header */}
        <div className="flex items-center gap-3.5 mb-6 pb-5 border-b border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-[#0066B2] text-white font-black text-2xl flex items-center justify-center shadow-md shadow-blue-600/20 font-heading">
            {profile.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 font-heading">{profile.name}</h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0066B2] font-bold border border-blue-100">
                CMRL Tier 3 Contributor
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">{profile.email}</p>
          </div>
        </div>

        {/* Singara Chennai NCMC Card Tile */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0066B2] to-[#004C8C] text-white shadow-md mb-6 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-blue-200">
                Singara Chennai NCMC Card
              </div>
              <div className="text-xs font-mono opacity-80 mt-0.5">
                •••• •••• •••• 8492
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-white/20 text-[10px] font-bold font-mono">
              CMRL 20% OFF
            </span>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <div className="text-[10px] text-blue-200 font-semibold uppercase">Live Balance</div>
              <div className="text-2xl font-black font-mono tracking-tight">
                {profile.singaraCardBalance || '₹340.00'}
              </div>
            </div>

            <button
              onClick={handleQuickRecharge}
              className="px-3 py-1.5 rounded-xl bg-white text-[#0066B2] hover:bg-blue-50 font-black text-xs flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {recharged ? 'Recharged!' : '+ ₹100 Top-Up'}
            </button>
          </div>
        </div>

        {/* Commuter Achievements & Model Stats */}
        <div className="grid grid-cols-3 gap-2.5 mb-6 text-center">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 shadow-xs">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#0066B2]" />
              XP Points
            </div>
            <div className="text-base font-black font-mono text-[#0066B2]">{profile.xpPoints}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 shadow-xs">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              Trips Trained
            </div>
            <div className="text-base font-black font-mono text-slate-900">{profile.contributionsCount}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 shadow-xs">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Time Saved
            </div>
            <div className="text-base font-black font-mono text-amber-600">18.5m/day</div>
          </div>
        </div>

        {/* Change Commuter Persona */}
        <div className="mb-5">
          <label className="text-xs font-bold text-slate-800 block mb-2">Commuter Persona</label>
          <div className="grid grid-cols-2 gap-2.5">
            {personas.map((p) => {
              const isSelected = profile.persona === p.id;
              return (
                <button
                  key={p.id}
                  id={`profile-persona-${p.id}`}
                  onClick={() => onUpdateProfile({ ...profile, persona: p.id })}
                  className={`p-3 rounded-2xl border text-xs font-semibold transition-all text-left flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-xs ring-1 ring-blue-200'
                      : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{p.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#0066B2]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Change Priority Preference */}
        <div className="mb-6">
          <label className="text-xs font-bold text-slate-800 block mb-2">Primary Prediction Priority</label>
          <div className="space-y-2">
            {preferences.map((pref) => {
              const isSelected = profile.preference === pref.id;
              return (
                <button
                  key={pref.id}
                  id={`profile-pref-${pref.id}`}
                  onClick={() => onUpdateProfile({ ...profile, preference: pref.id })}
                  className={`w-full p-3 rounded-2xl border text-xs font-medium transition-all text-left flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold shadow-xs ring-1 ring-blue-200'
                      : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{pref.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#0066B2]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Crowd DNA Shortcut */}
        <button
          onClick={() => {
            onClose();
            onOpenCrowdDNA();
          }}
          className="w-full p-3.5 rounded-2xl bg-blue-50 border border-blue-100 hover:bg-blue-100/70 text-[#0066B2] text-xs font-bold flex items-center justify-between transition-all mb-4 shadow-xs cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#0066B2]" />
            <span>Open Chennai Metro Crowd DNA Heatmap</span>
          </div>
          <span className="text-[11px] text-[#0066B2] font-mono font-bold">View ➔</span>
        </button>

        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold text-xs transition-all shadow-md cursor-pointer"
        >
          Save & Close
        </button>
      </motion.div>
    </div>
  );
};
