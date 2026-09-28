import React, { useState, useEffect } from 'react';
import { useTransit } from '../../services/transitApi/transitContext';
import { ROUTE_LOOKUP } from '../../data/uaRoutes';
import { STOP_LOOKUP } from '../../data/uaStops';

export const LiveTripGuide: React.FC = () => {
  const {
    liveTripProgress,
    advanceLiveTripLeg,
    cancelLiveTrip,
    buses,
  } = useTransit();

  const [simulatedSecondsLeft, setSimulatedSecondsLeft] = useState<number>(180);

  useEffect(() => {
    const timer = setInterval(() => {
      setSimulatedSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!liveTripProgress) return null;

  const { trip, currentLegIndex, isCompleted } = liveTripProgress;
  const currentLeg = trip.legs[currentLegIndex] || trip.legs[trip.legs.length - 1];

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Find active bus telemetry if on transit leg
  const currentBus = currentLeg.busId
    ? buses.find((b) => b.id === currentLeg.busId)
    : buses.find((b) => b.routeId === currentLeg.routeId);

  const route = currentLeg.routeId ? ROUTE_LOOKUP.get(currentLeg.routeId) : null;
  const destStop = currentLeg.arrivalStopId ? STOP_LOOKUP.get(currentLeg.arrivalStopId) : null;

  const isNextStopDestination =
    currentLeg.type === 'transit' &&
    (currentBus?.nextStopId === currentLeg.arrivalStopId || simulatedSecondsLeft < 75);

  return (
    <div className="bg-slate-900 text-white rounded-xl shadow-xl border border-slate-800 p-4 sm:p-5 flex flex-col gap-4 animate-in fade-in duration-200">
      {/* Top Banner with live badge & cancel */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold tracking-wider uppercase text-emerald-400">
            Live Trip Navigation
          </span>
        </div>
        <button
          onClick={cancelLiveTrip}
          className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors"
        >
          Exit Guidance
        </button>
      </div>

      {isCompleted ? (
        <div className="text-center py-4 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl font-bold">
            ✓
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">You Have Arrived!</h3>
            <p className="text-xs text-slate-400 mt-1">
              Destination reached at {currentLeg.toName}. Roll Tide!
            </p>
          </div>
          <button
            onClick={cancelLiveTrip}
            className="mt-2 px-4 py-2 bg-[#9E1B32] hover:bg-[#831629] text-white text-xs font-bold rounded-lg transition-colors"
          >
            Finish Navigation
          </button>
        </div>
      ) : (
        <>
          {/* Leg-specific display */}
          {currentLeg.type === 'walk' && (
            <div className="flex flex-col gap-3">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Step {currentLegIndex + 1} of {trip.legs.length}: Walking
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">
                Walk to {currentLeg.toName}
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-300">
                <span>
                  ⏱ Est. walk time: <strong>{currentLeg.durationMinutes} min</strong>
                </span>
                <span>
                  📍 Distance: <strong>{currentLeg.distanceMiles || 0.1} mi</strong>
                </span>
              </div>
            </div>
          )}

          {currentLeg.type === 'transit' && (
            <div className="flex flex-col gap-3">
              {/* Alert if destination stop is approaching */}
              {isNextStopDestination ? (
                <div className="bg-[#9E1B32] text-white rounded-lg p-3.5 shadow-md flex items-center gap-3 animate-pulse">
                  <span className="text-xl">🔔</span>
                  <div>
                    <div className="text-xs font-black tracking-wider uppercase">
                      Get Ready
                    </div>
                    <div className="text-sm font-bold">
                      {destStop?.name || currentLeg.toName} is your next stop!
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  You are boarding / on Bus #{currentLeg.busNumber || '42'}
                </div>
              )}

              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-lg sm:text-xl font-black text-white">
                    {currentLeg.routeName}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Riding toward {currentLeg.toName}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Arriving in</div>
                  <div className="text-xl font-mono font-bold text-white tabular-nums">
                    {formatCountdown(simulatedSecondsLeft)}
                  </div>
                </div>
              </div>

              {/* Progress info */}
              <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60 text-xs text-slate-300 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Next stop:</span>
                  <span className="font-semibold text-white">
                    {currentBus?.nextStopId
                      ? STOP_LOOKUP.get(currentBus.nextStopId)?.name || 'Campus Station'
                      : destStop?.name || 'Engineering Quad'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Stops remaining:</span>
                  <span className="font-semibold text-white">
                    {Math.max(1, currentLeg.stopsCount ? currentLeg.stopsCount - 1 : 2)} stops away
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Vehicle Speed:</span>
                  <span className="font-mono text-slate-300">
                    {currentBus?.speedMph || 18} mph
                  </span>
                </div>
              </div>
            </div>
          )}

          {currentLeg.type === 'transfer_wait' && (
            <div className="flex flex-col gap-2">
              <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Transfer Point
              </div>
              <div className="text-lg font-bold text-white">
                Transfer at {currentLeg.fromName}
              </div>
              <p className="text-xs text-slate-400">
                Wait for connecting bus ({currentLeg.durationMinutes} min estimated connection).
              </p>
            </div>
          )}

          {/* Action step advancement */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={advanceLiveTripLeg}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span>
                {currentLegIndex === trip.legs.length - 1
                  ? 'Complete Trip'
                  : 'Next Step →'}
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
