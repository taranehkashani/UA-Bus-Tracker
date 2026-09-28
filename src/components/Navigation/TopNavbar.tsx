import React from 'react';
import { useTransit } from '../../services/transitApi/transitContext';

interface TopNavbarProps {
  activeTab: 'planner' | 'routes' | 'stops' | 'search';
  onSelectTab: (tab: 'planner' | 'routes' | 'stops' | 'search') => void;
  onOpenSearch: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenSearch,
}) => {
  const { isLiveSource, buses } = useTransit();

  return (
    <header className="h-16 px-4 sm:px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 select-none z-30">
      {/* Zone 1: Single Brand Wordmark */}
      <div className="flex items-center gap-3">
        <a
          href="/"
          className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('planner');
          }}
        >
          <span className="w-7 h-7 rounded-lg bg-[#9E1B32] text-white flex items-center justify-center font-black text-sm shadow-sm">
            UA
          </span>
          <span>Crimson Ride</span>
        </a>
      </div>

      {/* Zone 2: Clean 4-6 Nav Tabs */}
      <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
        <button
          onClick={() => onSelectTab('planner')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'planner'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Trip Planner
        </button>
        <button
          onClick={() => onSelectTab('routes')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'routes'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Routes
        </button>
        <button
          onClick={() => onSelectTab('stops')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'stops'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Stops
        </button>
      </nav>

      {/* Zone 3: Actions + Honest Demo Indicator */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Source status indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              isLiveSource ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span>{isLiveSource ? 'LIVE UA GPS' : 'DEMO SIMULATION'}</span>
          <span aria-hidden="true">·</span>
          <span>{buses.length} buses</span>
        </div>

        {/* Universal Search trigger */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors border border-slate-200/60"
          aria-label="Search routes, stops, buildings"
        >
          <svg
            className="w-3.5 h-3.5 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <span className="hidden sm:inline">Search UA Campus...</span>
          <span className="sm:hidden">Search</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-white rounded border border-slate-200 shadow-2xs">
            /
          </kbd>
        </button>
      </div>
    </header>
  );
};
