import React, { useEffect, useState } from 'react';
import { useTransit } from '../../services/transitApi/transitContext';
import { STOP_LOOKUP } from '../../data/uaStops';
import { ROUTE_LOOKUP } from '../../data/uaRoutes';
import { Arrival } from '../../types/transit';

interface StopDetailModalProps {
  stopId: string;
  onClose: () => void;
  onSetAsOrigin: (stopName: string, coords: [number, number]) => void;
  onSetAsDestination: (stopName: string, coords: [number, number]) => void;
}

export const StopDetailModal: React.FC<StopDetailModalProps> = ({
  stopId,
  onClose,
  onSetAsOrigin,
  onSetAsDestination,
}) => {
  const { provider, selectBus } = useTransit();
  const stop = STOP_LOOKUP.get(stopId);
  const [arrivals, setArrivals] = useState<Arrival[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!stopId) return;

    setLoading(true);
    const unsubscribe = provider.subscribeArrivals(stopId, (updatedArrivals) => {
      setArrivals(updatedArrivals);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [stopId, provider]);

  if (!stop) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200/90 p-4 sm:p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Bus Stop Detail · {stop.code}
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">
            {stop.name}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{stop.description}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Close stop details"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Serving Routes */}
      <div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          Routes Serving this Stop
        </div>
        <div className="flex flex-wrap gap-1.5">
          {stop.routeIds.map((rid) => {
            const route = ROUTE_LOOKUP.get(rid);
            if (!route) return null;
            return (
              <span
                key={rid}
                className="text-xs font-semibold px-2 py-0.5 rounded text-white flex items-center gap-1.5"
                style={{ backgroundColor: route.color }}
              >
                <span>{route.shortName}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Upcoming Buses */}
      <div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Upcoming Buses</span>
          <span className="text-slate-400 font-normal">Live arrival times</span>
        </div>

        {loading ? (
          <div className="text-xs text-slate-400 py-3 text-center">Checking vehicle GPS...</div>
        ) : arrivals.length === 0 ? (
          <div className="text-xs text-slate-500 py-3 text-center bg-slate-50 rounded-lg">
            No buses actively approaching this stop at this moment.
          </div>
        ) : (
          <div className="space-y-2">
            {arrivals.map((arr) => {
              return (
                <div
                  key={arr.busId}
                  onClick={() => selectBus(arr.busId)}
                  className="p-3 rounded-lg border border-slate-200 hover:border-slate-400 bg-slate-50/60 hover:bg-white transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: arr.routeColor }}
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-[#9E1B32] transition-colors">
                        {arr.routeName} — Bus #{arr.busNumber}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        {arr.direction}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-sm font-black tabular-nums ${
                        arr.isApproaching ? 'text-emerald-600 animate-pulse' : 'text-slate-900'
                      }`}
                    >
                      {arr.isApproaching ? 'ARRIVING NOW' : `${arr.minutesAway} min`}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {arr.isApproaching ? 'At platform' : `approx. ${arr.secondsAway}s`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stop Amenities */}
      <div className="flex items-center gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
        <span className="flex items-center gap-1">
          {stop.hasShelter ? '✓ Shelter' : '✗ No Shelter'}
        </span>
        <span aria-hidden="true">·</span>
        <span className="flex items-center gap-1">
          {stop.isAccessible ? '♿ Wheelchair Accessible' : 'Standard'}
        </span>
        <span aria-hidden="true">·</span>
        <span className="flex items-center gap-1">
          {stop.bench ? 'Bench' : 'Stand'}
        </span>
      </div>

      {/* Quick Action Buttons: Set as start or end of trip */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={() => onSetAsOrigin(stop.name, [stop.latitude, stop.longitude])}
          className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors text-center"
        >
          Depart from here
        </button>
        <button
          onClick={() => onSetAsDestination(stop.name, [stop.latitude, stop.longitude])}
          className="py-2 px-3 bg-[#9E1B32] hover:bg-[#831629] text-white text-xs font-semibold rounded-lg transition-colors text-center"
        >
          Travel to here
        </button>
      </div>
    </div>
  );
};
