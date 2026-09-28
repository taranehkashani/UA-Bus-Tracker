import React from 'react';
import { useTransit } from '../../services/transitApi/transitContext';
import { STOP_LOOKUP } from '../../data/uaStops';

export const RouteListPanel: React.FC = () => {
  const {
    routes,
    buses,
    selectedRouteId,
    selectRoute,
    selectStop,
    selectBus,
  } = useTransit();

  const selectedRoute = routes.find((r) => r.id === selectedRouteId);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold tracking-tight text-slate-900 uppercase">
          Campus Routes ({routes.length})
        </h2>
        {selectedRouteId && (
          <button
            onClick={() => selectRoute(null)}
            className="text-xs text-[#9E1B32] hover:text-[#7f1527] font-semibold"
          >
            Show All Routes
          </button>
        )}
      </div>

      {/* Routes Grid / List */}
      <div className="space-y-2">
        {routes.map((route) => {
          const isSelected = selectedRouteId === route.id;
          const routeBuses = buses.filter((b) => b.routeId === route.id);

          return (
            <div
              key={route.id}
              className={`rounded-xl border transition-all overflow-hidden ${
                isSelected
                  ? 'border-slate-900 bg-white shadow-md'
                  : 'border-slate-200/90 bg-white hover:border-slate-300 shadow-2xs'
              }`}
            >
              {/* Route Card Header */}
              <button
                type="button"
                onClick={() => selectRoute(isSelected ? null : route.id)}
                className="w-full p-3.5 text-left flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: route.color }}
                  />
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {route.name}
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {route.description}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-semibold text-slate-800 tabular-nums">
                    {routeBuses.length} active {routeBuses.length === 1 ? 'bus' : 'buses'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    every {route.frequencyMinutes}m
                  </div>
                </div>
              </button>

              {/* Expanded Route Details (Stops in order + Active buses) */}
              {isSelected && (
                <div className="p-3.5 border-t border-slate-100 bg-slate-50/70 space-y-4">
                  {/* Active Buses list */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Live Buses on this Route
                    </div>
                    {routeBuses.length === 0 ? (
                      <div className="text-xs text-slate-500 italic">
                        No active buses on route right now.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {routeBuses.map((bus) => (
                          <button
                            key={bus.id}
                            type="button"
                            onClick={() => selectBus(bus.id)}
                            className="p-2.5 rounded-lg bg-white border border-slate-200 text-left hover:border-slate-400 transition-colors flex items-center justify-between"
                          >
                            <div>
                              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <span>🚌 Bus #{bus.busNumber}</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              </div>
                              <div className="text-[10px] text-slate-500 truncate max-w-[140px] mt-0.5">
                                Next: {STOP_LOOKUP.get(bus.nextStopId)?.name || 'Campus Quad'}
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">
                              {bus.speedMph} mph
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Complete Stops in sequential order */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Stops in Order ({route.stopIds.length})
                    </div>
                    <div className="space-y-1 relative pl-2 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {route.stopIds.map((stopId, index) => {
                        const stop = STOP_LOOKUP.get(stopId);
                        if (!stop) return null;

                        return (
                          <button
                            key={stopId}
                            type="button"
                            onClick={() => selectStop(stop.id)}
                            className="w-full text-left p-1.5 rounded-md hover:bg-white text-xs text-slate-700 hover:text-slate-900 flex items-center gap-2.5 transition-colors group cursor-pointer"
                          >
                            <span className="w-4 h-4 rounded-full bg-white border border-slate-300 text-[10px] font-bold text-slate-600 flex items-center justify-center shrink-0 z-10 group-hover:border-[#9E1B32] group-hover:text-[#9E1B32]">
                              {index + 1}
                            </span>
                            <span className="font-medium truncate group-hover:text-[#9E1B32]">
                              {stop.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                    <span>Hours: {route.operatingHours}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
