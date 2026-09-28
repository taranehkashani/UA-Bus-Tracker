import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Bus, Route, Stop, Arrival, TripOption, LiveTripProgress } from '../../types/transit';
import { defaultTransitProvider } from './DemoTransitDataProvider';
import { TransitDataProvider } from './TransitDataProvider';
import { STOP_LOOKUP } from '../../data/uaStops';

interface TransitContextType {
  provider: TransitDataProvider;
  routes: Route[];
  stops: Stop[];
  buses: Bus[];
  lastUpdated: number;
  isLiveSource: boolean;
  sourceName: string;

  // Selected entities for map & detail cards
  selectedRouteId: string | null;
  selectedStopId: string | null;
  selectedBusId: string | null;
  activeTripOption: TripOption | null;
  liveTripProgress: LiveTripProgress | null;

  // Current user GPS or simulated position
  userLocation: [number, number] | null;
  userLocationAccuracy: number | null;
  isLocatingUser: boolean;
  locationError: string | null;

  // Actions
  selectRoute: (routeId: string | null) => void;
  selectStop: (stopId: string | null) => void;
  selectBus: (busId: string | null) => void;
  setActiveTripOption: (trip: TripOption | null) => void;
  startLiveTrip: (trip: TripOption) => void;
  advanceLiveTripLeg: () => void;
  cancelLiveTrip: () => void;
  requestUserLocation: () => Promise<void>;
  setUserLocationManually: (coords: [number, number]) => void;
  getArrivalsForStop: (stopId: string) => Promise<Arrival[]>;
}

const TransitContext = createContext<TransitContextType | null>(null);

// Default UA Quad coordinates when geolocation isn't granted yet
export const UA_CAMPUS_CENTER: [number, number] = [33.2140, -87.5391];

export const TransitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const provider = defaultTransitProvider;

  const [routes, setRoutes] = useState<Route[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [activeTripOption, setActiveTripOption] = useState<TripOption | null>(null);
  const [liveTripProgress, setLiveTripProgress] = useState<LiveTripProgress | null>(null);

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [userLocationAccuracy, setUserLocationAccuracy] = useState<number | null>(null);
  const [isLocatingUser, setIsLocatingUser] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Initialize data and subscriptions
  useEffect(() => {
    provider.getRoutes().then(setRoutes);
    provider.getStops().then(setStops);

    const unsubscribeBuses = provider.subscribeBuses((updatedBuses) => {
      setBuses(updatedBuses);
      setLastUpdated(provider.getLastUpdated());
    });

    return () => {
      unsubscribeBuses();
    };
  }, [provider]);

  // Request browser geolocation safely
  const requestUserLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocatingUser(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocatingUser(false);
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setUserLocationAccuracy(position.coords.accuracy);
      },
      (error) => {
        setIsLocatingUser(false);
        // If outside Tuscaloosa or permission denied, set gentle campus fallback
        setLocationError(error.message || 'Unable to retrieve location.');
        // Set fallback to Ferguson Student Center so user gets a great instant experience
        setUserLocation([33.2152, -87.5415]);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
    );
  }, []);

  const setUserLocationManually = useCallback((coords: [number, number]) => {
    setUserLocation(coords);
    setLocationError(null);
  }, []);

  const selectRoute = useCallback((routeId: string | null) => {
    setSelectedRouteId(routeId);
    if (routeId) {
      setSelectedBusId(null);
    }
  }, []);

  const selectStop = useCallback((stopId: string | null) => {
    setSelectedStopId(stopId);
    if (stopId) {
      setSelectedBusId(null);
    }
  }, []);

  const selectBus = useCallback((busId: string | null) => {
    setSelectedBusId(busId);
    if (busId) {
      const bus = buses.find((b) => b.id === busId);
      if (bus) {
        setSelectedRouteId(bus.routeId);
      }
    }
  }, [buses]);

  const startLiveTrip = useCallback((trip: TripOption) => {
    const transitLeg = trip.legs.find((leg) => leg.type === 'transit');
    const matchedBus = transitLeg?.busId
      ? buses.find((b) => b.id === transitLeg.busId)
      : buses.find((b) => b.routeId === transitLeg?.routeId);

    const initialProgress: LiveTripProgress = {
      trip,
      currentLegIndex: 0,
      startedAt: Date.now(),
      isCompleted: false,
      activeBus: matchedBus,
      nextStopName: transitLeg?.arrivalStopId ? STOP_LOOKUP.get(transitLeg.arrivalStopId)?.name : undefined,
      stopsRemaining: transitLeg?.stopsCount || 3,
      approachingDestination: false,
    };

    setLiveTripProgress(initialProgress);
    setActiveTripOption(trip);
  }, [buses]);

  const advanceLiveTripLeg = useCallback(() => {
    setLiveTripProgress((prev) => {
      if (!prev) return null;
      const nextIndex = prev.currentLegIndex + 1;
      if (nextIndex >= prev.trip.legs.length) {
        return {
          ...prev,
          currentLegIndex: nextIndex,
          isCompleted: true,
          approachingDestination: true,
        };
      }
      return {
        ...prev,
        currentLegIndex: nextIndex,
        approachingDestination: nextIndex === prev.trip.legs.length - 1,
      };
    });
  }, []);

  const cancelLiveTrip = useCallback(() => {
    setLiveTripProgress(null);
  }, []);

  const getArrivalsForStop = useCallback(
    async (stopId: string): Promise<Arrival[]> => {
      return provider.getArrivals(stopId);
    },
    [provider]
  );

  const value = useMemo(
    () => ({
      provider,
      routes,
      stops,
      buses,
      lastUpdated,
      isLiveSource: provider.isLiveSource(),
      sourceName: provider.getSourceName(),
      selectedRouteId,
      selectedStopId,
      selectedBusId,
      activeTripOption,
      liveTripProgress,
      userLocation,
      userLocationAccuracy,
      isLocatingUser,
      locationError,
      selectRoute,
      selectStop,
      selectBus,
      setActiveTripOption,
      startLiveTrip,
      advanceLiveTripLeg,
      cancelLiveTrip,
      requestUserLocation,
      setUserLocationManually,
      getArrivalsForStop,
    }),
    [
      provider,
      routes,
      stops,
      buses,
      lastUpdated,
      selectedRouteId,
      selectedStopId,
      selectedBusId,
      activeTripOption,
      liveTripProgress,
      userLocation,
      userLocationAccuracy,
      isLocatingUser,
      locationError,
      selectRoute,
      selectStop,
      selectBus,
      setActiveTripOption,
      startLiveTrip,
      advanceLiveTripLeg,
      cancelLiveTrip,
      requestUserLocation,
      setUserLocationManually,
      getArrivalsForStop,
    ]
  );

  return <TransitContext.Provider value={value}>{children}</TransitContext.Provider>;
};

export const useTransit = (): TransitContextType => {
  const context = useContext(TransitContext);
  if (!context) {
    throw new Error('useTransit must be used within a TransitProvider');
  }
  return context;
};
