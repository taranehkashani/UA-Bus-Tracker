import React, { useState } from 'react';
import { useTransit } from '../../services/transitApi/transitContext';
import { ROUTE_LOOKUP } from '../../data/uaRoutes';

export const StopListPanel: React.FC = () => {
  const { stops, selectedStopId, selectStop } = useTransit();
  const [filterQuery, setFilterQuery] = useState('');

  const filteredStops = stops.filter(
    (s) =>
      s.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Header & Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold tracking-tight text-slate-900 uppercase">
          Campus Bus Stops ({stops.length})
        </h2>
      </div>

      <div className="relative">
        <input
          type="text"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Filter stops by name or code..."
          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#9E1B32] text-slate-900 placeholder:text-slate-400 bg-white"
        />
      </div>

      {/* Stop Cards List */}
      <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
        {filteredStops.map((stop) => {
          const isSelected = selectedStopId === stop.id;

          return (
            <button
              key={stop.id}
              type="button"
              onClick={() => selectStop(isSelected ? null : stop.id)}
              className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#9E1B32] bg-white ring-2 ring-[#9E1B32]/10 shadow-sm'
                  : 'border-slate-200/90 bg-white hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-slate-900">{stop.name}</div>
                  <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {stop.description}
                  </div>
                </div>
                <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                  {stop.code}
                </span>
              </div>

              {/* Badges of routes serving stop */}
              <div className="flex flex-wrap gap-1 mt-2.5">
                {stop.routeIds.map((rid) => {
                  const route = ROUTE_LOOKUP.get(rid);
                  if (!route) return null;
                  return (
                    <span
                      key={rid}
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                      style={{ backgroundColor: route.color }}
                    >
                      {route.shortName}
                    </span>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
