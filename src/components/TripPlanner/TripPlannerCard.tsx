import React, { useState, useEffect } from 'react';
import { useTransit } from '../../services/transitApi/transitContext';
import { CAMPUS_LOCATIONS } from '../../data/campusLocations';
import { UA_STOPS } from '../../data/uaStops';
import {
  calculateTrips,
  parseNaturalLanguageQuery,
  RouteRequest,
} from '../../services/routingService';
import { CampusLocation, Stop } from '../../types/transit';

interface TripPlannerCardProps {
  onPlanTrip: (request: RouteRequest) => void;
}

export const TripPlannerCard: React.FC<TripPlannerCardProps> = ({ onPlanTrip }) => {
  const { userLocation, requestUserLocation, isLocatingUser } = useTransit();

  const [fromQuery, setFromQuery] = useState<string>('Current location');
  const [fromCoords, setFromCoords] = useState<[number, number] | null>(null);

  const [toQuery, setToQuery] = useState<string>('');
  const [toCoords, setToCoords] = useState<[number, number] | null>(null);

  const [isFromDropdownOpen, setIsFromDropdownOpen] = useState(false);
  const [isToDropdownOpen, setIsToDropdownOpen] = useState(false);

  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [showNaturalSearch, setShowNaturalSearch] = useState(false);

  // Set default origin when userLocation is available
  useEffect(() => {
    if (userLocation && fromQuery === 'Current location') {
      setFromCoords(userLocation);
    }
  }, [userLocation, fromQuery]);

  // Handle Quick Shortcuts
  const handleSelectQuickDest = (locationName: string, coords: [number, number]) => {
    setToQuery(locationName);
    setToCoords(coords);
    handleExecutePlan({
      destCoords: coords,
      destName: locationName,
    });
  };

  const handleSelectOrigin = (name: string, coords: [number, number]) => {
    setFromQuery(name);
    setFromCoords(coords);
    setIsFromDropdownOpen(false);
  };

  const handleSelectDestination = (name: string, coords: [number, number]) => {
    setToQuery(name);
    setToCoords(coords);
    setIsToDropdownOpen(false);
  };

  const handleSwap = () => {
    const tempQuery = fromQuery;
    const tempCoords = fromCoords;
    setFromQuery(toQuery);
    setFromCoords(toCoords);
    setToQuery(tempQuery);
    setToCoords(tempCoords);
  };

  const handleExecutePlan = (overrides?: {
    originCoords?: [number, number];
    originName?: string;
    destCoords?: [number, number];
    destName?: string;
  }) => {
    const fCoords = overrides?.originCoords || fromCoords || userLocation || [33.2152, -87.5415];
    const fName = overrides?.originName || fromQuery || 'Current location';

    const tCoords = overrides?.destCoords || toCoords;
    const tName = overrides?.destName || toQuery;

    if (!tCoords || !tName) {
      // If user hasn't chosen a destination, default to Shelby Hall / Engineering Quad
      const defaultDest = CAMPUS_LOCATIONS.find((l) => l.id === 'loc_shelby_hall')!;
      setToQuery(defaultDest.name);
      setToCoords([defaultDest.latitude, defaultDest.longitude]);
      onPlanTrip({
        originCoords: fCoords,
        originName: fName,
        destinationCoords: [defaultDest.latitude, defaultDest.longitude],
        destinationName: defaultDest.name,
      });
      return;
    }

    onPlanTrip({
      originCoords: fCoords,
      originName: fName,
      destinationCoords: tCoords,
      destinationName: tName,
    });
  };

  // Natural language query handler
  const handleNaturalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalLanguageInput.trim()) return;

    const parsed = parseNaturalLanguageQuery(naturalLanguageInput);

    let originC: [number, number] = userLocation || [33.2152, -87.5415];
    let originN = 'Current location';

    if (parsed.fromLocation) {
      originC = [parsed.fromLocation.latitude, parsed.fromLocation.longitude];
      originN = parsed.fromLocation.name;
    }

    let destC: [number, number] = [33.2144, -87.5315]; // Shelby Hall default
    let destN = 'Engineering Quad (Shelby Hall)';

    if (parsed.toLocation) {
      destC = [parsed.toLocation.latitude, parsed.toLocation.longitude];
      destN = parsed.toLocation.name;
    } else if (parsed.toText) {
      // Find closest substring in locations
      const match = CAMPUS_LOCATIONS.find((l) =>
        l.name.toLowerCase().includes(parsed.toText!.toLowerCase())
      );
      if (match) {
        destC = [match.latitude, match.longitude];
        destN = match.name;
      }
    }

    setFromQuery(originN);
    setFromCoords(originC);
    setToQuery(destN);
    setToCoords(destC);

    handleExecutePlan({
      originCoords: originC,
      originName: originN,
      destCoords: destC,
      destName: destN,
    });
  };

  // Filter campus locations for dropdown
  const filteredFromLocations = CAMPUS_LOCATIONS.filter((l) =>
    l.name.toLowerCase().includes(fromQuery.toLowerCase())
  ).slice(0, 5);

  const filteredToLocations = CAMPUS_LOCATIONS.filter((l) =>
    l.name.toLowerCase().includes(toQuery.toLowerCase())
  ).slice(0, 6);

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-4 sm:p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-slate-900 uppercase">
            Where are you going?
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Door-to-door campus transit & live bus connections
          </p>
        </div>
        <button
          onClick={() => setShowNaturalSearch(!showNaturalSearch)}
          className="text-xs text-[#9E1B32] hover:text-[#7f1527] font-semibold underline underline-offset-2 transition-colors"
        >
          {showNaturalSearch ? 'Standard Form' : 'Ask in Plain English'}
        </button>
      </div>

      {showNaturalSearch ? (
        <form onSubmit={handleNaturalSubmit} className="flex flex-col gap-2">
          <div className="relative">
            <input
              type="text"
              value={naturalLanguageInput}
              onChange={(e) => setNaturalLanguageInput(e.target.value)}
              placeholder="e.g. How do I get from Ridgecrest to the Engineering Quad?"
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#9E1B32] focus:border-transparent text-slate-900 placeholder:text-slate-400"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-[#9E1B32] hover:bg-[#831629] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>Calculate Best Route</span>
            </button>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Try: <span className="text-slate-700 italic">"Fastest way to get to the Student Center"</span> or <span className="text-slate-700 italic">"Directions to Bryant-Denny"</span>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Origin Input */}
          <div className="relative">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              From
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400 text-xs">📍</span>
              <input
                type="text"
                value={fromQuery}
                onChange={(e) => {
                  setFromQuery(e.target.value);
                  setIsFromDropdownOpen(true);
                }}
                onFocus={() => setIsFromDropdownOpen(true)}
                placeholder="Current location or campus stop"
                className="w-full text-xs sm:text-sm pl-8 pr-8 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#9E1B32] focus:border-transparent text-slate-900 bg-slate-50/50"
              />
              <button
                type="button"
                onClick={requestUserLocation}
                disabled={isLocatingUser}
                title="Use current GPS"
                className="absolute right-2 text-slate-400 hover:text-slate-700 p-1"
              >
                {isLocatingUser ? (
                  <div className="w-3.5 h-3.5 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 text-[#9E1B32]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>

            {/* From Dropdown suggestions */}
            {isFromDropdownOpen && filteredFromLocations.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    handleSelectOrigin('Current location', userLocation || [33.2152, -87.5415]);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-[#9E1B32] hover:bg-slate-50 flex items-center gap-2 border-b border-slate-100"
                >
                  <span>📍</span>
                  <span>Current GPS Location</span>
                </button>
                {filteredFromLocations.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => handleSelectOrigin(loc.name, [loc.latitude, loc.longitude])}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex flex-col"
                  >
                    <span className="font-medium text-slate-900">{loc.name}</span>
                    <span className="text-[10px] text-slate-500 capitalize">{loc.category}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Swap icon */}
          <div className="flex justify-center -my-1">
            <button
              type="button"
              onClick={handleSwap}
              className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors shadow-2xs"
              title="Swap origin and destination"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          {/* Destination Input */}
          <div className="relative">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              To
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400 text-xs">🔎</span>
              <input
                type="text"
                value={toQuery}
                onChange={(e) => {
                  setToQuery(e.target.value);
                  setIsToDropdownOpen(true);
                }}
                onFocus={() => setIsToDropdownOpen(true)}
                placeholder="Search a building, dorm, stop, or quad"
                className="w-full text-xs sm:text-sm pl-8 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#9E1B32] focus:border-transparent text-slate-900 bg-white"
              />
            </div>

            {/* To Dropdown suggestions */}
            {isToDropdownOpen && filteredToLocations.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-56 overflow-y-auto">
                {filteredToLocations.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => handleSelectDestination(loc.name, [loc.latitude, loc.longitude])}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex flex-col border-b border-slate-100 last:border-0"
                  >
                    <span className="font-semibold text-slate-900">{loc.name}</span>
                    <span className="text-[10px] text-slate-500">{loc.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Submit Action */}
          <button
            type="button"
            onClick={() => handleExecutePlan()}
            className="w-full py-2.5 px-4 bg-[#9E1B32] hover:bg-[#831629] text-white text-xs sm:text-sm font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 mt-1"
          >
            <span>FIND MY BUS</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      )}

      {/* Quick Campus Shortcuts */}
      <div className="pt-2 border-t border-slate-100">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Popular UA Destinations
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: 'Engineering Quad', coords: [33.2144, -87.5315] as [number, number] },
            { label: 'Student Center', coords: [33.2152, -87.5415] as [number, number] },
            { label: 'Bryant-Denny', coords: [33.2084, -87.5498] as [number, number] },
            { label: 'Rec Center', coords: [33.2198, -87.5358] as [number, number] },
            { label: 'The Quad / Gorgas', coords: [33.2126, -87.5412] as [number, number] },
            { label: 'Tutwiler', coords: [33.2079, -87.5450] as [number, number] },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => handleSelectQuickDest(item.label, item.coords)}
              className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-md transition-colors whitespace-nowrap"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
