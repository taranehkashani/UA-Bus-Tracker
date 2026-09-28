import React, { useState } from 'react';

interface MobileBottomSheetProps {
  children: React.ReactNode;
  activeTab: 'planner' | 'routes' | 'stops' | 'search';
  onSelectTab: (tab: 'planner' | 'routes' | 'stops' | 'search') => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  children,
  activeTab,
  onSelectTab,
  isOpen,
  onToggle,
}) => {
  return (
    <div className="md:hidden fixed inset-x-0 bottom-0 z-40 flex flex-col pointer-events-none">
      {/* Draggable/Expandable Sheet */}
      <div
        className={`pointer-events-auto bg-white rounded-t-2xl shadow-2xl border-t border-slate-200 transition-all duration-300 ease-in-out flex flex-col ${
          isOpen ? 'max-h-[75vh]' : 'max-h-[140px]'
        }`}
      >
        {/* Grab Handle */}
        <div
          onClick={onToggle}
          className="w-full py-2.5 flex items-center justify-center cursor-pointer select-none"
        >
          <div className="w-12 h-1.5 rounded-full bg-slate-300" />
        </div>

        {/* Sheet Content Area */}
        <div className="px-4 pb-2 overflow-y-auto flex-1">{children}</div>

        {/* Bottom Tab Bar (MAP, ROUTES, TRIPS, SEARCH) */}
        <div className="h-14 bg-white border-t border-slate-200 px-4 flex items-center justify-around shrink-0 select-none">
          <button
            onClick={() => onSelectTab('planner')}
            className={`flex flex-col items-center gap-0.5 text-xs font-semibold ${
              activeTab === 'planner' ? 'text-[#9E1B32]' : 'text-slate-500'
            }`}
          >
            <span className="text-base">📍</span>
            <span>Trips</span>
          </button>

          <button
            onClick={() => onSelectTab('routes')}
            className={`flex flex-col items-center gap-0.5 text-xs font-semibold ${
              activeTab === 'routes' ? 'text-[#9E1B32]' : 'text-slate-500'
            }`}
          >
            <span className="text-base">🚌</span>
            <span>Routes</span>
          </button>

          <button
            onClick={() => onSelectTab('stops')}
            className={`flex flex-col items-center gap-0.5 text-xs font-semibold ${
              activeTab === 'stops' ? 'text-[#9E1B32]' : 'text-slate-500'
            }`}
          >
            <span className="text-base">🚏</span>
            <span>Stops</span>
          </button>

          <button
            onClick={() => onSelectTab('search')}
            className="flex flex-col items-center gap-0.5 text-xs font-semibold text-slate-500"
          >
            <span className="text-base">🔎</span>
            <span>Search</span>
          </button>
        </div>
      </div>
    </div>
  );
};
