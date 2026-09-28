import React, { useState } from 'react';
import { TripOption } from '../../types/transit';
import { useTransit } from '../../services/transitApi/transitContext';

interface TripResultsViewProps {
  options: TripOption[];
  onBack: () => void;
  onSelectOption: (option: TripOption) => void;
}

export const TripResultsView: React.FC<TripResultsViewProps> = ({
  options,
  onBack,
  onSelectOption,
}) => {
  const { startLiveTrip } = useTransit();
  const [selectedOptionId, setSelectedOptionId] = useState<string>(
    options[0]?.id || ''
  );

  const activeOption = options.find((opt) => opt.id === selectedOptionId) || options[0];

  if (!activeOption) {
    return (
      <div className="bg-white rounded-xl p-5 border border-slate-200 text-center">
        <p className="text-sm text-slate-600 mb-3">No direct bus or transit route found for this pair.</p>
        <button
          onClick={onBack}
          className="text-xs font-semibold text-[#9E1B32] hover:underline"
        >
          Try a different campus location
        </button>
      </div>
    );
  }

  const handleStartTrip = () => {
    startLiveTrip(activeOption);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Back & header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Modify Trip</span>
        </button>
        <span className="text-xs font-medium text-slate-500">
          {options.length} route options calculated
        </span>
      </div>

      {/* Option Selector Tabs if multiple */}
      {options.length > 1 && (
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg">
          {options.map((opt, idx) => (
            <button
              key={opt.id}
              onClick={() => {
                setSelectedOptionId(opt.id);
                onSelectOption(opt);
              }}
              className={`py-2 px-2 text-center rounded-md transition-all flex flex-col items-center justify-center ${
                selectedOptionId === opt.id
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              <span className="text-[10px] uppercase tracking-wide">
                {opt.isBestOption ? 'Best Option' : `Option ${idx + 1}`}
              </span>
              <span className="text-xs font-bold tabular-nums">
                {opt.totalMinutes} min
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Active Trip Option Detail Card */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 p-4 sm:p-5 flex flex-col gap-4">
        {/* Banner with Leave time & Arrival */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
            <span className="font-semibold uppercase tracking-wider text-slate-500 text-[10px]">
              Recommended Schedule
            </span>
            <span className="font-mono font-semibold text-slate-700">
              {activeOption.transfers === 0 ? '0 transfers' : `${activeOption.transfers} transfer`}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-xs text-slate-500">Leave by</div>
              <div className="text-lg sm:text-xl font-extrabold text-slate-900 tabular-nums">
                {activeOption.departureTime}
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-500">Estimated Arrival</div>
              <div className="text-lg sm:text-xl font-extrabold text-[#9E1B32] tabular-nums">
                {activeOption.arrivalTime}
              </div>
            </div>
          </div>

          {/* Quick breakdown metrics */}
          <div className="flex items-center gap-3 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-200/60">
            <span>
              Total: <strong className="text-slate-900">{activeOption.totalMinutes} min</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Walk: <strong className="text-slate-900">{activeOption.walkingMinutes} min</strong> ({activeOption.walkingMiles} mi)
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Transit: <strong className="text-slate-900">{activeOption.transitMinutes} min</strong>
            </span>
          </div>
        </div>

        {/* Real-time bus warning if student will miss current bus */}
        {activeOption.busWarning && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2.5">
            <span className="text-amber-600 text-sm">⚠️</span>
            <div className="flex-1">
              <div className="font-bold text-amber-950">
                {activeOption.busWarning.type === 'missed_current_bus'
                  ? 'Catching Bus Notice'
                  : 'Transit Advisory'}
              </div>
              <div className="mt-0.5">{activeOption.busWarning.message}</div>
              {activeOption.busWarning.nextBusNotice && (
                <div className="mt-1 font-semibold text-amber-900">
                  {activeOption.busWarning.nextBusNotice}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step-by-Step Directions */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            Step-by-Step Directions
          </h3>
          <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {activeOption.legs.map((leg, index) => {
              if (leg.type === 'walk') {
                return (
                  <div key={index} className="flex items-start gap-3 relative pl-1">
                    <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0 z-10">
                      🚶
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                        <span>{leg.instruction}</span>
                        <span className="text-slate-500 font-mono text-[11px] tabular-nums">
                          {leg.durationMinutes} min
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        From {leg.fromName} ({leg.distanceMiles ? `${leg.distanceMiles} mi` : 'short walk'})
                      </div>
                    </div>
                  </div>
                );
              }

              if (leg.type === 'transit') {
                return (
                  <div key={index} className="flex items-start gap-3 relative pl-1">
                    <div
                      className="w-5 h-5 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0 z-10 shadow-xs"
                      style={{ backgroundColor: leg.routeColor || '#9E1B32' }}
                    >
                      🚌
                    </div>
                    <div className="flex-1 min-w-0 bg-slate-50/80 rounded-lg p-3 border border-slate-200/80">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          {leg.routeName} {leg.busNumber ? `— Bus #${leg.busNumber}` : ''}
                        </span>
                        <span className="text-xs font-mono font-bold text-[#9E1B32] tabular-nums">
                          {leg.durationMinutes} min
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 mt-1">
                        Board at: <strong className="text-slate-900">{leg.fromName}</strong>
                      </div>

                      <div className="text-xs text-slate-600 mt-0.5">
                        Ride: <strong>{leg.stopsCount || 4} stops</strong> (~{leg.durationMinutes} min)
                      </div>

                      <div className="text-xs text-slate-600 mt-0.5">
                        Get off at: <strong className="text-slate-900">{leg.toName}</strong>
                      </div>

                      {/* Stop Sequence preview */}
                      {leg.stopsList && leg.stopsList.length > 0 && (
                        <div className="mt-2 text-[10px] text-slate-500 border-t border-slate-200/60 pt-1.5">
                          <span className="font-semibold">Passing: </span>
                          <span>{leg.stopsList.slice(0, 3).join(' → ')}</span>
                          {leg.stopsList.length > 3 && ` +${leg.stopsList.length - 3} more`}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              if (leg.type === 'transfer_wait') {
                return (
                  <div key={index} className="flex items-start gap-3 relative pl-1">
                    <div className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center text-xs font-bold shrink-0 z-10">
                      ⇄
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                        <span>{leg.instruction}</span>
                        <span className="text-slate-500 font-mono text-[11px] tabular-nums">
                          {leg.durationMinutes} min wait
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>

        {/* Start Trip CTA */}
        <button
          onClick={handleStartTrip}
          className="w-full py-3 px-4 bg-[#9E1B32] hover:bg-[#831629] text-white text-sm font-extrabold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 group cursor-pointer"
        >
          <span>START TRIP</span>
          <svg
            className="w-4 h-4 group-hover:translate-x-1 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
};
