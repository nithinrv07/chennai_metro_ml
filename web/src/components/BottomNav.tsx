import React from 'react';
import { Home, Compass, TrainFront, BrainCircuit, BarChart3 } from 'lucide-react';

export type NavTab = 'home' | 'network' | 'engine' | 'coach' | 'profile';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  coachAlertCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  coachAlertCount = 1,
}) => {
  const tabs = [
    { id: 'home' as NavTab, label: 'CMRL Home', icon: Home },
    { id: 'network' as NavTab, label: 'Metro Map', icon: Compass },
    { id: 'engine' as NavTab, label: 'ML Engine', icon: TrainFront },
    { id: 'coach' as NavTab, label: 'Smart Coach', icon: BrainCircuit, badge: coachAlertCount },
    { id: 'profile' as NavTab, label: 'Crowd DNA', icon: BarChart3 },
  ];

  return (
    <nav id="bottom-navigation-bar" className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-2 sm:px-4 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
      <div className="max-w-lg mx-auto grid grid-cols-5 gap-1 sm:gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all relative cursor-pointer active:scale-95 ${
                isActive
                  ? 'text-[#0066B2] font-black bg-blue-50/90 shadow-xs ring-1 ring-blue-100'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.75]'}`} />
                {tab.badge && tab.badge > 0 && !isActive && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-[#0066B2] text-white font-black text-[9px] rounded-full flex items-center justify-center shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 font-bold uppercase tracking-wider leading-none whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
