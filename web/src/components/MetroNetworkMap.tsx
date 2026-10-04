import React, { useMemo } from 'react';
import { ArrowLeftRight, Route, Clock, TrainFront } from 'lucide-react';
import { RouteStop, BusTransit } from '../types';
import { ALL_METRO_STATIONS } from '../data/transitData';
import { calculateCommuterRoute } from '../utils/routePlanner';

interface MetroNetworkMapProps {
  currentStop: RouteStop;
  destination: string;
  buses: BusTransit[];
  onSelectStation: (station: RouteStop) => void;
  onSelectDestination: (dest: string) => void;
  onOpenBoardingEngine: (busId?: string) => void;
  onOpenSmartCoach: () => void;
}

// Keep the existing component contract so journey selections remain shared with Plan.
export const MetroNetworkMap: React.FC<MetroNetworkMapProps> = ({
  currentStop, destination, onSelectStation, onSelectDestination,
}) => {
  const route = useMemo(
    () => calculateCommuterRoute(currentStop, destination, ALL_METRO_STATIONS),
    [currentStop, destination],
  );
  const sameStation = route.origin.id === route.destination.id;
  const selectClass = 'mt-2 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div id="metro-network-map-view" className="mx-auto max-w-5xl space-y-5">
      <section aria-labelledby="journey-summary-heading" className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="journey-summary-heading" className="text-2xl font-black text-slate-900">Your journey</h2>
            <p className="mt-1 text-sm text-slate-500">Your stations and line changes, in travel order.</p>
          </div>
          <button type="button" onClick={() => {
            onSelectStation(route.destination);
            onSelectDestination(currentStop.name);
          }} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-500">
            <ArrowLeftRight className="h-4 w-4" aria-hidden="true" /> Reverse route
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="min-w-0 text-xs font-bold uppercase tracking-wide text-slate-500">
            From
            <select aria-label="Departure station" value={route.origin.id} className={selectClass} onChange={event => {
              const station = ALL_METRO_STATIONS.find(st => st.id === event.target.value);
              if (station) onSelectStation(station);
            }}>
              {ALL_METRO_STATIONS.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
            </select>
          </label>
          <label className="min-w-0 text-xs font-bold uppercase tracking-wide text-slate-500">
            To
            <select aria-label="Destination station" value={route.destination.id} className={selectClass} onChange={event => {
              const station = ALL_METRO_STATIONS.find(st => st.id === event.target.value);
              if (station) onSelectDestination(station.name);
            }}>
              {ALL_METRO_STATIONS.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
            </select>
          </label>
        </div>

        <div aria-live="polite" className="mt-5">
          {sameStation ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">You have selected the same station. Choose a different destination to plan a journey.</p>
          ) : (
            <>
              <p className="break-words text-lg font-bold text-slate-900">{route.origin.name} <span aria-label="to">→</span> {route.destination.name}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  { Icon: Route, label: 'Stops after departure', value: String(route.stopCount) },
                  { Icon: Clock, label: 'Estimated journey time', value: `~${route.estimatedMinutes} min` },
                  { Icon: TrainFront, label: 'Line changes', value: route.isDirect ? 'Direct · 0 transfers' : '1 transfer' },
                ].map(({ Icon, label, value }) => (
                  <div key={label} className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500"><Icon className="h-4 w-4 shrink-0" aria-hidden="true" />{label}</div>
                    <p className="mt-2 text-base font-bold text-slate-900">{value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm font-semibold text-blue-800">{route.lineSummary}</p>
              {route.interchangeStation && <p className="mt-2 text-sm text-purple-800">Change lines at {route.interchangeStation.name}.</p>}
              <p className="mt-3 text-xs leading-relaxed text-slate-500">Travel time is a route estimate, not a live arrival prediction. Train waiting time is not included.</p>
            </>
          )}
        </div>
      </section>

      {!sameStation && (
        <section aria-labelledby="journey-stations-heading" className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs">
          <h3 id="journey-stations-heading" className="text-lg font-bold text-slate-900">Stations along your route</h3>
          <ol className="mt-5 space-y-3">
            {route.stations.map((station, index) => {
              const first = index === 0;
              const last = index === route.stations.length - 1;
              const transfer = station.id === route.interchangeStation?.id;
              const label = first ? 'Departure' : last ? 'Destination' : transfer ? 'Change lines here' : `Stop ${index}`;
              return (
                <li key={station.id} className={`flex items-start gap-3 rounded-2xl border p-4 ${transfer ? 'border-purple-200 bg-purple-50' : 'border-slate-100 bg-slate-50'}`}>
                  <span aria-hidden="true" className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${first ? 'bg-blue-700 text-white' : last ? 'bg-emerald-700 text-white' : transfer ? 'bg-purple-700 text-white' : 'bg-white text-slate-600'}`}>{index + 1}</span>
                  <div className="min-w-0">
                    <p className="break-words text-sm font-bold text-slate-900">{station.name}</p>
                    <p className={`mt-1 text-xs ${transfer ? 'font-bold text-purple-800' : 'text-slate-500'}`}>{label}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
};
