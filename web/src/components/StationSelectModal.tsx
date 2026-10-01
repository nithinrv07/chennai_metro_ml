import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, Search, Navigation, Check, X, TrainFront, 
  Sparkles, Clock, Users, ArrowRight, ShieldCheck, RefreshCw,
  Compass, Layers
} from 'lucide-react';
import { RouteStop } from '../types';
import { ALL_METRO_STATIONS } from '../data/transitData';

interface StationSelectModalProps {
  currentStation?: RouteStop;
  currentStop?: RouteStop;
  onSelectStation: (station: RouteStop) => void;
  onClose: () => void;
}

type LineFilter = 'all' | 'blue' | 'green' | 'interchange';

export const StationSelectModal: React.FC<StationSelectModalProps> = ({
  currentStation,
  currentStop,
  onSelectStation,
  onClose,
}) => {
  const activeStation = currentStation || currentStop;
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<LineFilter>('all');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationSuccess, setLocationSuccess] = useState<string | null>(null);

  const filteredStations = ALL_METRO_STATIONS.filter((station) => {
    // Search query match
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !query ||
      station.name.toLowerCase().includes(query) ||
      (station.tamilName && station.tamilName.toLowerCase().includes(query)) ||
      station.linesServing?.some(l => l.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    // Line filter match
    if (activeFilter === 'blue') {
      return station.linesServing?.some(l => l.toLowerCase().includes('blue')) || station.id.includes('guindy') || station.id.includes('airport') || station.id.includes('saidapet') || station.id.includes('teynampet') || station.id.includes('nandanam') || station.id.includes('thousand') || station.id.includes('wimco') || station.id.includes('high-court');
    }
    if (activeFilter === 'green') {
      return station.linesServing?.some(l => l.toLowerCase().includes('green')) || station.id.includes('koyambedu') || station.id.includes('vadapalani') || station.id.includes('annanagar') || station.id.includes('st-thomas');
    }
    if (activeFilter === 'interchange') {
      return station.interchange || station.linesServing?.some(l => l.toLowerCase().includes('interchange') || l.toLowerCase().includes('junction') || l.toLowerCase().includes('both'));
    }

    return true;
  });

  const handleSimulateGPS = () => {
    setIsLocating(true);
    setLocationSuccess(null);
    setTimeout(() => {
      setIsLocating(false);
      const closest = ALL_METRO_STATIONS[0]; // Guindy
      onSelectStation(closest);
      setLocationSuccess(`GPS Locked: ${closest.name} (40m away)`);
      setTimeout(() => {
        onClose();
      }, 900);
    }, 1200);
  };

  return (
    <div id="station-select-overlay" className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white border border-slate-200/90 w-full max-w-xl rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Close Button */}
        <button
          id="close-station-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <div className="p-2.5 rounded-2xl bg-blue-50 text-[#0066B2]">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-[#0066B2] font-bold uppercase tracking-widest block">
              CMRL Network Navigator
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight font-heading">
              Select Current Metro Station
            </h2>
          </div>
        </div>

        {/* GPS Quick Geo-locate Banner */}
        <div className="mb-4 shrink-0">
          <button
            id="gps-locate-btn"
            onClick={handleSimulateGPS}
            disabled={isLocating}
            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 text-left transition-all hover:border-blue-300 flex items-center justify-between group cursor-pointer active:scale-98"
          >
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${isLocating ? 'bg-blue-600 text-white' : 'bg-white text-[#0066B2] shadow-xs'}`}>
                {isLocating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>{isLocating ? 'Scanning Chennai Metro Beacons...' : 'Use My Live GPS Location'}</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded-md">Auto-Detect</span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {locationSuccess || 'Detects your nearest platform & entry gate'}
                </div>
              </div>
            </div>

            <span className="text-xs font-bold text-[#0066B2] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              Locate <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            id="station-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Chennai station (e.g., Guindy, Alandur, Airport, Central, கிண்டி)..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0066B2] focus:bg-white transition-all shadow-xs font-medium"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Line Filter Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 shrink-0">
          {[
            { id: 'all', label: 'All Stations' },
            { id: 'blue', label: 'Blue Line (Corridor 1)' },
            { id: 'green', label: 'Green Line (Corridor 2)' },
            { id: 'interchange', label: 'Interchanges' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as LineFilter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-[#0066B2] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Stations List */}
        <div className="overflow-y-auto space-y-2.5 pr-1 flex-1 min-h-[220px]">
          {filteredStations.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Compass className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600">No matching Chennai Metro stations</p>
              <p className="text-[11px] text-slate-400">Try searching "Central", "Alandur", "Airport", or "Vadapalani"</p>
            </div>
          ) : (
            filteredStations.map((station) => {
              const isSelected = activeStation?.id === station.id;
              const isInterchange = station.interchange;
              const isBlue = station.linesServing?.some(l => l.includes('Blue'));
              const isGreen = station.linesServing?.some(l => l.includes('Green'));

              return (
                <button
                  key={station.id}
                  id={`station-card-${station.id}`}
                  onClick={() => {
                    onSelectStation(station);
                    onClose();
                  }}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between group cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/90 border-[#0066B2] text-blue-950 shadow-xs ring-1 ring-[#0066B2]/30'
                      : 'bg-white border-slate-200 hover:bg-slate-50/80 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-2xl ${
                      isSelected
                        ? 'bg-[#0066B2] text-white'
                        : isInterchange
                        ? 'bg-purple-100 text-purple-700'
                        : isGreen
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      <TrainFront className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">{station.name}</span>
                        {station.tamilName && (
                          <span className="text-[11px] text-slate-400 font-medium font-sans">
                            ({station.tamilName})
                          </span>
                        )}
                        {isSelected && (
                          <span className="text-[9px] bg-[#0066B2] text-white font-bold px-1.5 py-0.2 rounded-md uppercase">
                            Current
                          </span>
                        )}
                      </div>

                      {/* Station Metadata Tags */}
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-medium flex-wrap">
                        {isInterchange ? (
                          <span className="text-purple-700 font-bold bg-purple-50 px-1.5 py-0.2 rounded border border-purple-100">
                            Bi-Level Interchange
                          </span>
                        ) : isGreen ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                            Green Line
                          </span>
                        ) : (
                          <span className="text-blue-700 font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                            Blue Line
                          </span>
                        )}

                        <span>•</span>
                        <span>{station.queueLength} in queue</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-semibold">{station.boardingRateHistorical}% clearance</span>
                        {station.distanceMeters && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400">{station.walkMinutes} min walk</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 pl-2">
                    {isSelected ? (
                      <div className="w-7 h-7 rounded-full bg-[#0066B2] text-white flex items-center justify-center shadow-xs">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    ) : (
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-transform group-hover:translate-x-0.5" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between shrink-0 font-medium">
          <span>Changing station dynamically updates live rake telemetries & doors.</span>
          <span className="font-bold text-slate-600">CMRL Network Active</span>
        </div>
      </motion.div>
    </div>
  );
};
