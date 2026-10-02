import React from 'react';
import { Compass, Map, TrainFront, BarChart3, ShieldCheck } from 'lucide-react';
import { Language } from '../types';

export type NavTab = 'plan' | 'map' | 'mytrip' | 'trends';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  activeTripCount?: number;
  language?: Language;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  activeTripCount = 0,
  language = 'en',
}) => {
  const isTa = language === 'ta';

  const tabs = [
    { 
      id: 'plan' as NavTab, 
      label: isTa ? 'திட்டமிடு' : 'Plan', 
      sublabel: isTa ? 'பயணம்' : 'Journey',
      icon: Compass 
    },
    { 
      id: 'map' as NavTab, 
      label: isTa ? 'வரைபடம்' : 'Map', 
      sublabel: isTa ? 'நெட்வொர்க்' : 'Network',
      icon: Map 
    },
    { 
      id: 'mytrip' as NavTab, 
      label: isTa ? 'எனது பயணம்' : 'My Trip', 
      sublabel: isTa ? 'லைவ்' : 'Live Ride',
      icon: TrainFront, 
      badge: activeTripCount 
    },
    { 
      id: 'trends' as NavTab, 
      label: isTa ? 'நெரிசல் போக்கு' : 'Crowd Trends', 
      sublabel: isTa ? 'டிஎன்ஏ' : 'Crowd DNA',
      icon: BarChart3 
    },
  ];

  return (
    <nav 
      id="bottom-navigation-bar" 
      aria-label="Commuter Navigation Bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-3 sm:px-6 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]"
    >
      <div className="max-w-md mx-auto grid grid-cols-4 gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onChangeTab(tab.id)}
              aria-label={tab.label}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all relative cursor-pointer active:scale-95 ${
                isActive
                  ? 'text-[#0066B2] font-black bg-blue-50/90 shadow-xs ring-1 ring-blue-100'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.75]'}`} />
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-emerald-500 text-white font-black text-[9px] rounded-full flex items-center justify-center shadow-xs animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 font-bold tracking-tight leading-none whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
