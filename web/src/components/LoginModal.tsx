import React, { useState } from 'react';
import { motion } from 'motion/react';
import { TrainFront, User, LogIn, ArrowRight, ShieldCheck, CreditCard } from 'lucide-react';
import { UserProfile } from '../types';

interface LoginModalProps {
  currentProfile: UserProfile;
  onLoginSuccess: (profile: UserProfile) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ currentProfile, onLoginSuccess }) => {
  const [email, setEmail] = useState('karthik.s@tcs-chennai.com');
  const [name, setName] = useState('Karthik Sundaram');
  const [isLoading, setIsLoading] = useState(false);

  const presetUsers = [
    {
      name: 'Karthik Sundaram',
      email: 'karthik.s@tcs-chennai.com',
      role: 'OMR IT Tech Commuter (Guindy ⇄ Tidel Park)',
      persona: 'commuter' as const,
      xp: 420,
      balance: '₹480.00',
    },
    {
      name: 'Divya Narayanan',
      email: 'divya.n@annauniv.edu',
      role: 'Anna University Student (Saidapet ⇄ Guindy)',
      persona: 'student' as const,
      xp: 590,
      balance: '₹220.00',
    },
    {
      name: 'Dr. Rajesh Raman',
      email: 'dr.rajesh@apollo.org',
      role: 'Apollo Hospital Specialist (Central ⇄ Airport)',
      persona: 'shift' as const,
      xp: 380,
      balance: '₹650.00',
    },
  ];

  const handleLogin = (selectedName: string, selectedEmail: string, persona: any, xp: number, balance?: string) => {
    setIsLoading(true);
    setTimeout(() => {
      onLoginSuccess({
        ...currentProfile,
        name: selectedName,
        email: selectedEmail,
        persona: persona || currentProfile.persona,
        xpPoints: xp || currentProfile.xpPoints,
        singaraCardBalance: balance || currentProfile.singaraCardBalance || '₹340.00',
      });
      setIsLoading(false);
    }, 400);
  };

  return (
    <div id="login-modal-overlay" className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border border-gray-200/80 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0066B2] shadow-xs">
            <TrainFront className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Chennai Metro Sign In</h2>
            <p className="text-xs text-gray-500 font-medium">Singara Chennai NCMC Card & CMRL AI Profile</p>
          </div>
        </div>

        {/* Quick Demo Commuter Profiles */}
        <div className="mb-5">
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2.5">
            Instant Chennai Commuter Profiles
          </label>
          <div className="space-y-2">
            {presetUsers.map((u, idx) => (
              <button
                key={idx}
                id={`preset-login-${idx}`}
                onClick={() => handleLogin(u.name, u.email, u.persona, u.xp, u.balance)}
                className="w-full p-3.5 rounded-2xl bg-gray-50 border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 text-left transition-all flex items-center justify-between group shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#0066B2] flex items-center justify-center text-white font-bold text-xs shadow-xs">
                    {u.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900 group-hover:text-[#0066B2] transition-colors">{u.name}</div>
                    <div className="text-[11px] text-gray-500">{u.role}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {u.balance}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#0066B2] transition-transform group-hover:translate-x-1 ml-auto mt-1" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold text-gray-400 bg-white px-3 tracking-wider">
            Or login with your details
          </div>
        </div>

        {/* Email & Name form */}
        <form onSubmit={(e) => { e.preventDefault(); handleLogin(name, email, currentProfile.persona, currentProfile.xpPoints, currentProfile.singaraCardBalance); }} className="space-y-3.5">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Your Name</label>
            <input
              type="text"
              id="login-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              placeholder="e.g. Karthik Sundaram"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Email / Singara Registered ID</label>
            <input
              type="email"
              id="login-email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              placeholder="name@company.com"
              required
            />
          </div>

          <button
            type="submit"
            id="login-submit-btn"
            disabled={isLoading}
            className="w-full mt-2 py-3 rounded-2xl bg-[#0066B2] hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20 active:scale-[0.99] disabled:opacity-50"
          >
            {isLoading ? 'Connecting...' : 'Sign In & Connect CMRL AI Engine'}
            <LogIn className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0066B2]" />
          <span>Synchronized with CMRL Automated Fare Collection (AFC) telemetry</span>
        </div>
      </motion.div>
    </div>
  );
};
