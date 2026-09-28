import React, { useState, useEffect, useRef } from 'react';
import { useTransit } from '../../services/transitApi/transitContext';
import { CAMPUS_LOCATIONS } from '../../data/campusLocations';

interface UniversalSearchBarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCampusLocation?: (name: string, coords: [number, number]) => void;
}

interface SearchItem {
  id: string;
  type: 'route' | 'stop' | 'bus' | 'building';
  title: string;
  subtitle: string;
  color?: string;
  payload: any;
}

export const UniversalSearchBar: React.FC<UniversalSearchBarProps> = ({
  isOpen,
  onClose,
  onSelectCampusLocation,
}) => {
  const { routes, stops, buses, selectRoute, selectStop, selectBus } = useTransit();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build searchable corpus
  const searchResults: SearchItem[] = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      // Popular items initially
      return [
        {
          id: 'bldg_shelby',
          type: 'building',
          title: 'Shelby Hall (Engineering Quad)',
          subtitle: 'College of Engineering headquarters',
          payload: { coords: [33.2144, -87.5315] },
        },
        {
          id: 'bldg_ferg',
          type: 'building',
          title: 'Ferguson Student Center',
          subtitle: 'Student union & dining hub',
          payload: { coords: [33.2152, -87.5415] },
        },
        {
          id: 'route_crimson',
          type: 'route',
          title: 'Crimson Route',
          subtitle: 'Central campus loop · 8 stops',
          color: '#9E1B32',
          payload: { routeId: 'route_crimson' },
        },
        {
          id: 'bus_42',
          type: 'bus',
          title: 'Bus #42',
          subtitle: 'Active on Crimson Route',
          color: '#9E1B32',
          payload: { busId: 'bus_crimson_42' },
        },
      ];
    }

    const items: SearchItem[] = [];

    // 1. Check Routes
    routes.forEach((r) => {
      if (
        r.name.toLowerCase().includes(term) ||
        r.shortName.toLowerCase().includes(term) ||
        'routes'.includes(term)
      ) {
        items.push({
          id: `route_${r.id}`,
          type: 'route',
          title: r.name,
          subtitle: `${r.stopIds.length} stops · Every ${r.frequencyMinutes} min`,
          color: r.color,
          payload: { routeId: r.id },
        });
      }
    });

    // 2. Check Buses
    buses.forEach((b) => {
      if (
        b.busNumber.toLowerCase().includes(term) ||
        `bus ${b.busNumber}`.toLowerCase().includes(term) ||
        `#${b.busNumber}`.toLowerCase().includes(term)
      ) {
        const route = routes.find((r) => r.id === b.routeId);
        items.push({
          id: `bus_${b.id}`,
          type: 'bus',
          title: `Bus #${b.busNumber}`,
          subtitle: `${route?.name || 'Campus bus'} · Heading ${b.direction}`,
          color: route?.color,
          payload: { busId: b.id },
        });
      }
    });

    // 3. Check Stops
    stops.forEach((s) => {
      if (
        s.name.toLowerCase().includes(term) ||
        s.code.toLowerCase().includes(term) ||
        (s.description && s.description.toLowerCase().includes(term))
      ) {
        items.push({
          id: `stop_${s.id}`,
          type: 'stop',
          title: s.name,
          subtitle: `${s.code} · ${s.routeIds.length} routes serving this stop`,
          payload: { stopId: s.id, coords: [s.latitude, s.longitude] },
        });
      }
    });

    // 4. Check Campus Buildings / Locations
    CAMPUS_LOCATIONS.forEach((loc) => {
      const match =
        loc.name.toLowerCase().includes(term) ||
        loc.aliases.some((a) => a.toLowerCase().includes(term)) ||
        loc.category.toLowerCase().includes(term);

      if (match) {
        items.push({
          id: `bldg_${loc.id}`,
          type: 'building',
          title: loc.name,
          subtitle: loc.description || `Campus ${loc.category}`,
          payload: { coords: [loc.latitude, loc.longitude], name: loc.name },
        });
      }
    });

    return items.slice(0, 10);
  }, [searchTerm, routes, stops, buses]);

  const handleSelectItem = (item: SearchItem) => {
    if (item.type === 'route') {
      selectRoute(item.payload.routeId);
    } else if (item.type === 'bus') {
      selectBus(item.payload.busId);
    } else if (item.type === 'stop') {
      selectStop(item.payload.stopId);
    } else if (item.type === 'building' && onSelectCampusLocation) {
      onSelectCampusLocation(item.title, item.payload.coords);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, searchResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + searchResults.length) % Math.max(1, searchResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[selectedIndex]) {
        handleSelectItem(searchResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200">
          <svg className="w-5 h-5 text-slate-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search buses (Bus 42), routes (Crimson), dorms, quads..."
            className="flex-1 text-sm bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
          />
          <button
            onClick={onClose}
            className="text-xs font-mono text-slate-400 hover:text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 hover:bg-slate-100"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {searchResults.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No matching UA bus routes, stops, or campus buildings found.
            </div>
          ) : (
            <div className="space-y-1">
              {searchResults.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-colors ${
                      isSelected ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.type === 'route' && (
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                      )}
                      {item.type === 'bus' && (
                        <span className="w-6 h-6 rounded bg-[#9E1B32] text-white flex items-center justify-center text-xs font-bold shrink-0">
                          🚌
                        </span>
                      )}
                      {item.type === 'stop' && (
                        <span className="w-6 h-6 rounded bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                          🚏
                        </span>
                      )}
                      {item.type === 'building' && (
                        <span className="w-6 h-6 rounded bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
                          🏛️
                        </span>
                      )}
                      <div>
                        <div className="text-xs font-bold text-slate-900">{item.title}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">
                          {item.subtitle}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                      {item.type}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer guidance */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Navigate with ↑ and ↓</span>
          <span>Press Enter to select</span>
        </div>
      </div>
    </div>
  );
};
