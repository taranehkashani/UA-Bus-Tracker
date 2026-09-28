import React, { useState, useCallback } from 'react';
import { TransitProvider, useTransit } from './services/transitApi/transitContext';
import { CampusMap } from './components/Map/CampusMap';
import { TopNavbar } from './components/Navigation/TopNavbar';
import { TripPlannerCard } from './components/TripPlanner/TripPlannerCard';
import { TripResultsView } from './components/TripResults/TripResultsView';
import { LiveTripGuide } from './components/LiveTrip/LiveTripGuide';
import { RouteListPanel } from './components/RouteList/RouteListPanel';
import { StopListPanel } from './components/StopDetails/StopListPanel';
import { StopDetailModal } from './components/StopDetails/StopDetailModal';
import { BusDetailModal } from './components/BusDetails/BusDetailModal';
import { UniversalSearchBar } from './components/Search/UniversalSearchBar';
import { MobileBottomSheet } from './components/Mobile/MobileBottomSheet';
import { RouteRequest, calculateTrips } from './services/routingService';
import { TripOption } from './types/transit';

const AppContent: React.FC = () => {
  const {
    buses,
    selectedStopId,
    selectedBusId,
    selectedRouteId,
    liveTripProgress,
    selectStop,
    selectBus,
    setActiveTripOption,
    setUserLocationManually,
    sourceName,
    isLiveSource,
    lastUpdated,
  } = useTransit();

  const [activeTab, setActiveTab] = useState<'planner' | 'routes' | 'stops' | 'search'>('planner');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [calculatedTripOptions, setCalculatedTripOptions] = useState<TripOption[] | null>(null);
  const [isMobileSheetExpanded, setIsMobileSheetExpanded] = useState(true);

  // Handle Trip Calculation
  const handlePlanTrip = useCallback(
    (request: RouteRequest) => {
      const options = calculateTrips(request, buses, Date.now());
      setCalculatedTripOptions(options);
      if (options.length > 0) {
        setActiveTripOption(options[0]);
      }
      setActiveTab('planner');
      setIsMobileSheetExpanded(true);
    },
    [buses, setActiveTripOption]
  );

  const handleSelectTripOption = useCallback(
    (option: TripOption) => {
      setActiveTripOption(option);
    },
    [setActiveTripOption]
  );

  const handleClearTrip = useCallback(() => {
    setCalculatedTripOptions(null);
    setActiveTripOption(null);
  }, [setActiveTripOption]);

  const handleTabChange = (tab: 'planner' | 'routes' | 'stops' | 'search') => {
    if (tab === 'search') {
      setIsSearchOpen(true);
    } else {
      setActiveTab(tab);
      setIsMobileSheetExpanded(true);
    }
  };

  const handleStopDepart = (stopName: string, coords: [number, number]) => {
    // Fill origin and calculate default trip to Engineering Quad
    handlePlanTrip({
      originName: stopName,
      originCoords: coords,
      destinationName: 'Engineering Quad (Shelby Hall)',
      destinationCoords: [33.2144, -87.5315],
    });
    selectStop(null);
  };

  const handleStopArrive = (stopName: string, coords: [number, number]) => {
    // Fill destination and calculate trip from Student Center
    handlePlanTrip({
      originName: 'Ferguson Student Center',
      originCoords: [33.2152, -87.5415],
      destinationName: stopName,
      destinationCoords: coords,
    });
    selectStop(null);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 text-slate-900 font-sans">
      {/* Top Bar with Brand & Clean Navigation */}
      <TopNavbar
        activeTab={activeTab}
        onSelectTab={handleTabChange}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Demo Notice Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 flex items-center justify-between text-[11px] text-amber-900">
        <div className="flex items-center gap-2">
          <span className="font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-950 font-mono text-[10px]">
            DEMO MODE
          </span>
          <span className="hidden sm:inline">
            Simulating live University of Alabama bus movements along active campus routes.
          </span>
          <span className="sm:hidden">Simulating UA campus transit.</span>
        </div>
        <div className="text-[10px] text-amber-800 font-mono">
          Architecture ready for UA GTFS-RT feed
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Desktop Sidebar (Left Pane) */}
        <aside className="hidden md:flex flex-col w-[420px] lg:w-[460px] bg-white border-r border-slate-200/90 shadow-sm z-20 overflow-hidden shrink-0">
          {/* Scrollable Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* If Live Trip is Active */}
            {liveTripProgress ? (
              <LiveTripGuide />
            ) : selectedStopId ? (
              <StopDetailModal
                stopId={selectedStopId}
                onClose={() => selectStop(null)}
                onSetAsOrigin={handleStopDepart}
                onSetAsDestination={handleStopArrive}
              />
            ) : selectedBusId ? (
              <BusDetailModal
                busId={selectedBusId}
                onClose={() => selectBus(null)}
              />
            ) : calculatedTripOptions ? (
              <TripResultsView
                options={calculatedTripOptions}
                onBack={handleClearTrip}
                onSelectOption={handleSelectTripOption}
              />
            ) : activeTab === 'routes' ? (
              <RouteListPanel />
            ) : activeTab === 'stops' ? (
              <StopListPanel />
            ) : (
              <div className="space-y-4">
                <TripPlannerCard onPlanTrip={handlePlanTrip} />
                <RouteListPanel />
              </div>
            )}
          </div>

          {/* Sidebar Footer info */}
          <div className="p-3 bg-slate-50 border-t border-slate-200/80 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="font-semibold text-slate-700">Crimson Ride Assistant</span>
            <span className="text-slate-400">University of Alabama</span>
          </div>
        </aside>

        {/* Map Workspace (Right Pane / Full on Mobile) */}
        <main className="flex-1 h-full relative">
          <CampusMap />

          {/* Mobile Bottom Sheet Content */}
          <MobileBottomSheet
            activeTab={activeTab}
            onSelectTab={handleTabChange}
            isOpen={isMobileSheetExpanded}
            onToggle={() => setIsMobileSheetExpanded(!isMobileSheetExpanded)}
          >
            {liveTripProgress ? (
              <LiveTripGuide />
            ) : selectedStopId ? (
              <StopDetailModal
                stopId={selectedStopId}
                onClose={() => selectStop(null)}
                onSetAsOrigin={handleStopDepart}
                onSetAsDestination={handleStopArrive}
              />
            ) : selectedBusId ? (
              <BusDetailModal
                busId={selectedBusId}
                onClose={() => selectBus(null)}
              />
            ) : calculatedTripOptions ? (
              <TripResultsView
                options={calculatedTripOptions}
                onBack={handleClearTrip}
                onSelectOption={handleSelectTripOption}
              />
            ) : activeTab === 'routes' ? (
              <RouteListPanel />
            ) : activeTab === 'stops' ? (
              <StopListPanel />
            ) : (
              <TripPlannerCard onPlanTrip={handlePlanTrip} />
            )}
          </MobileBottomSheet>
        </main>
      </div>

      {/* Universal Search Modal */}
      <UniversalSearchBar
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectCampusLocation={(name, coords) => {
          handlePlanTrip({
            originName: 'Ferguson Student Center',
            originCoords: [33.2152, -87.5415],
            destinationName: name,
            destinationCoords: coords,
          });
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <TransitProvider>
      <AppContent />
    </TransitProvider>
  );
}
