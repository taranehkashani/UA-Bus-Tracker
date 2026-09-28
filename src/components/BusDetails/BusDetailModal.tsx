import React from 'react';
import { useTransit } from '../../services/transitApi/transitContext';
import { ROUTE_LOOKUP } from '../../data/uaRoutes';
import { STOP_LOOKUP } from '../../data/uaStops';

interface BusDetailModalProps {
  busId: string;
  onClose: () => void;
}

export const BusDetailModal: React.FC<BusDetailModalProps> = ({ busId, onClose }) => {
  const { buses, lastUpdated } = useTransit();
  const bus = buses.find((b) => b.id === busId);

  if (!bus) return null;

  const route = ROUTE_LOOKUP.get(bus.routeId);
  const nextStop = STOP_LOOKUP.get(bus.nextStopId);

  // Compute following stops along the route loop
  const followingStops: Array<{ stopName: string; etaMinutes: number }> = [];
  if (route) {
    const nextStopIndex = route.stopIds.indexOf(bus.nextStopId);
    if (nextStopIndex !== -1) {
      for (let i = 0; i < Math.min(4, route.stopIds.length); i++) {
        const stopIdx = (nextStopIndex + i) % route.stopIds.length;
        const s = STOP_LOOKUP.get(route.stopIds[stopIdx]);
        if (s) {
          const eta = Math.round(bus.nextStopEtaSeconds / 60) + i * 3;
          followingStops.push({
            stopName: s.name,
            etaMinutes: Math.max(1, eta),
          });
        }
      }
    }
  }

  const secondsSinceUpdate = Math.max(
    1,
    Math.round((Date.now() - bus.timestamp) / 1000)
  );

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200/90 p-4 sm:p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xs"
            style={{ backgroundColor: route?.color || '#9E1B32' }}
          >
            🚌
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900">
                Bus #{bus.busNumber}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              {route?.name || 'Campus Shuttle'}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Close bus details"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Direction & Status info */}
      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-medium">Heading / Direction:</span>
          <span className="font-semibold text-slate-800">{bus.direction}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-medium">Next Arrival Stop:</span>
          <span className="font-bold text-[#9E1B32]">
            {nextStop?.name || 'Upcoming Platform'}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-medium">Estimated Arrival:</span>
          <span className="font-mono font-bold text-slate-900">
            {Math.round(bus.nextStopEtaSeconds / 60)} min ({bus.nextStopEtaSeconds}s)
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-medium">Telemetry Speed:</span>
          <span className="font-mono text-slate-700">{bus.speedMph} mph</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-medium">Passenger Load:</span>
          <span className="capitalize font-semibold text-slate-700">
            {bus.passengerLoad}
          </span>
        </div>
      </div>

      {/* Following Stops List */}
      <div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Following Stops & ETAs
        </div>
        <div className="space-y-1.5">
          {followingStops.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-xs p-2 rounded-md hover:bg-slate-50 border border-slate-100"
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span className="font-medium text-slate-800">{item.stopName}</span>
              </div>
              <span className="font-mono font-bold text-slate-600 tabular-nums">
                {item.etaMinutes} min
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Last update footer */}
      <div className="text-[11px] text-slate-400 text-center pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>Updated {secondsSinceUpdate} seconds ago</span>
      </div>
    </div>
  );
};
