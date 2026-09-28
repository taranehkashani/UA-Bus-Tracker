import { Bus, Route, Stop, Arrival } from '../../types/transit';
import { UA_ROUTES, ROUTE_LOOKUP } from '../../data/uaRoutes';
import { UA_STOPS, STOP_LOOKUP } from '../../data/uaStops';
import { TransitDataProvider } from './TransitDataProvider';

// Helper: Calculate distance in miles between coordinates
export function getDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Radius of Earth in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper: Calculate bearing in degrees from point 1 to point 2
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const y = Math.sin((lon2 - lon1) * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180));
  const x =
    Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
    Math.sin(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.cos((lon2 - lon1) * (Math.PI / 180));
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

interface BusSimulationState {
  bus: Bus;
  currentVertexIndex: number;
  progressBetweenVertices: number; // 0 to 1
  dwellSecondsRemaining: number; // For stop pauses
}

export class DemoTransitDataProvider implements TransitDataProvider {
  private routes: Route[] = UA_ROUTES;
  private stops: Stop[] = UA_STOPS;
  private busStates: Map<string, BusSimulationState> = new Map();
  private busListeners: Set<(buses: Bus[]) => void> = new Set();
  private stopListeners: Map<string, Set<(arrivals: Arrival[]) => void>> = new Map();
  private intervalTimer: number | null = null;
  private lastUpdated: number = Date.now();

  constructor() {
    this.initializeSimulatedBuses();
    this.startSimulationLoop();
  }

  private initializeSimulatedBuses() {
    // 7 buses covering the UA routes
    const initialBusesConfig: Array<{
      id: string;
      busNumber: string;
      routeId: string;
      direction: string;
      vertexIndex: number;
      progress: number;
      speedMph: number;
      passengerLoad: 'low' | 'moderate' | 'full';
    }> = [
      {
        id: 'bus_crimson_42',
        busNumber: '42',
        routeId: 'route_crimson',
        direction: 'Academic Quad & Engineering',
        vertexIndex: 1,
        progress: 0.4,
        speedMph: 18,
        passengerLoad: 'moderate',
      },
      {
        id: 'bus_crimson_37',
        busNumber: '37',
        routeId: 'route_crimson',
        direction: 'The Quad & Bryant-Denny',
        vertexIndex: 9,
        progress: 0.2,
        speedMph: 20,
        passengerLoad: 'low',
      },
      {
        id: 'bus_blue_18',
        busNumber: '18',
        routeId: 'route_blue',
        direction: 'Engineering & Ferguson Center',
        vertexIndex: 2,
        progress: 0.6,
        speedMph: 19,
        passengerLoad: 'moderate',
      },
      {
        id: 'bus_blue_29',
        busNumber: '29',
        routeId: 'route_blue',
        direction: 'Presidential Village & Rec Center',
        vertexIndex: 8,
        progress: 0.1,
        speedMph: 16,
        passengerLoad: 'full',
      },
      {
        id: 'bus_green_23',
        busNumber: '23',
        routeId: 'route_green',
        direction: 'Nursing & Bryce Campus',
        vertexIndex: 1,
        progress: 0.5,
        speedMph: 22,
        passengerLoad: 'low',
      },
      {
        id: 'bus_yellow_14',
        busNumber: '14',
        routeId: 'route_yellow',
        direction: 'Ferguson Center & The Quad',
        vertexIndex: 0,
        progress: 0.7,
        speedMph: 17,
        passengerLoad: 'moderate',
      },
      {
        id: 'bus_bronze_51',
        busNumber: '51',
        routeId: 'route_bronze',
        direction: 'North Campus Housing & Dining',
        vertexIndex: 3,
        progress: 0.3,
        speedMph: 21,
        passengerLoad: 'low',
      },
    ];

    for (const config of initialBusesConfig) {
      const route = ROUTE_LOOKUP.get(config.routeId);
      if (!route || route.shape.length < 2) continue;

      const p1 = route.shape[config.vertexIndex % route.shape.length];
      const p2 = route.shape[(config.vertexIndex + 1) % route.shape.length];
      const lat = p1[0] + (p2[0] - p1[0]) * config.progress;
      const lon = p1[1] + (p2[1] - p1[1]) * config.progress;
      const heading = calculateBearing(p1[0], p1[1], p2[0], p2[1]);

      // Find closest upcoming stop
      const nextStopId = this.findNextStopForBus(route, config.vertexIndex);

      const bus: Bus = {
        id: config.id,
        busNumber: config.busNumber,
        routeId: config.routeId,
        latitude: lat,
        longitude: lon,
        heading: Math.round(heading),
        speedMph: config.speedMph,
        timestamp: Date.now(),
        status: 'active',
        direction: config.direction,
        nextStopId,
        nextStopEtaSeconds: 180,
        passengerLoad: config.passengerLoad,
        segmentIndex: config.vertexIndex,
        progressOnSegment: config.progress,
      };

      this.busStates.set(config.id, {
        bus,
        currentVertexIndex: config.vertexIndex,
        progressBetweenVertices: config.progress,
        dwellSecondsRemaining: 0,
      });
    }
  }

  private findNextStopForBus(route: Route, currentVertexIndex: number): string {
    // Return first stop along remaining route
    if (route.stopIds.length === 0) return '';
    const approxStopIdx = Math.floor(
      (currentVertexIndex / route.shape.length) * route.stopIds.length
    ) % route.stopIds.length;
    return route.stopIds[(approxStopIdx + 1) % route.stopIds.length] || route.stopIds[0];
  }

  private startSimulationLoop() {
    if (typeof window === 'undefined') return;

    // Tick every 1000ms for smooth simulation and live countdown decrements
    this.intervalTimer = window.setInterval(() => {
      this.tickSimulation(1.0);
    }, 1000);
  }

  private tickSimulation(deltaSeconds: number) {
    this.lastUpdated = Date.now();
    const updatedBuses: Bus[] = [];

    this.busStates.forEach((state) => {
      const route = ROUTE_LOOKUP.get(state.bus.routeId);
      if (!route || route.shape.length < 2) return;

      // Handle boarding dwell time if stopped
      if (state.dwellSecondsRemaining > 0) {
        state.dwellSecondsRemaining -= deltaSeconds;
        state.bus.speedMph = 0;
        state.bus.timestamp = this.lastUpdated;
        updatedBuses.push({ ...state.bus });
        return;
      }

      // Resume regular speed (approx 15-22 mph)
      state.bus.speedMph = Math.max(14, state.bus.speedMph || 18);

      const p1 = route.shape[state.currentVertexIndex];
      const nextVertex = (state.currentVertexIndex + 1) % route.shape.length;
      const p2 = route.shape[nextVertex];

      const segmentMiles = getDistanceMiles(p1[0], p1[1], p2[0], p2[1]);
      const milesTraveled = (state.bus.speedMph / 3600) * deltaSeconds;
      const progressDelta = segmentMiles > 0 ? milesTraveled / segmentMiles : 0.05;

      state.progressBetweenVertices += progressDelta;

      if (state.progressBetweenVertices >= 1) {
        state.progressBetweenVertices = 0;
        state.currentVertexIndex = nextVertex;

        // Occasional boarding pause at major stop
        const isNearStop = state.currentVertexIndex % 3 === 0;
        if (isNearStop && Math.random() > 0.4) {
          state.dwellSecondsRemaining = 6; // 6s simulated dwell
        }
      }

      const currentP1 = route.shape[state.currentVertexIndex];
      const currentP2 = route.shape[(state.currentVertexIndex + 1) % route.shape.length];

      state.bus.latitude =
        currentP1[0] + (currentP2[0] - currentP1[0]) * state.progressBetweenVertices;
      state.bus.longitude =
        currentP1[1] + (currentP2[1] - currentP1[1]) * state.progressBetweenVertices;

      const rawBearing = calculateBearing(
        currentP1[0],
        currentP1[1],
        currentP2[0],
        currentP2[1]
      );
      state.bus.heading = Math.round(rawBearing);
      state.bus.timestamp = this.lastUpdated;
      state.bus.segmentIndex = state.currentVertexIndex;
      state.bus.progressOnSegment = state.progressBetweenVertices;

      // Compute nearest upcoming stop & ETA
      state.bus.nextStopId = this.findNextStopForBus(route, state.currentVertexIndex);
      const nextStop = STOP_LOOKUP.get(state.bus.nextStopId);
      if (nextStop) {
        const dist = getDistanceMiles(
          state.bus.latitude,
          state.bus.longitude,
          nextStop.latitude,
          nextStop.longitude
        );
        const etaMinutes = Math.max(0.5, (dist / Math.max(12, state.bus.speedMph)) * 60);
        state.bus.nextStopEtaSeconds = Math.round(etaMinutes * 60);
      }

      updatedBuses.push({ ...state.bus });
    });

    // Notify bus subscribers
    this.busListeners.forEach((callback) => callback(updatedBuses));

    // Notify stop arrival subscribers
    this.stopListeners.forEach((callbacks, stopId) => {
      this.getArrivals(stopId).then((arrivals) => {
        callbacks.forEach((cb) => cb(arrivals));
      });
    });
  }

  public async getRoutes(): Promise<Route[]> {
    return [...this.routes];
  }

  public async getStops(): Promise<Stop[]> {
    return [...this.stops];
  }

  public async getBuses(): Promise<Bus[]> {
    return Array.from(this.busStates.values()).map((s) => ({ ...s.bus }));
  }

  public async getArrivals(stopId: string): Promise<Arrival[]> {
    const stop = STOP_LOOKUP.get(stopId);
    if (!stop) return [];

    const arrivals: Arrival[] = [];
    const buses = await this.getBuses();

    for (const bus of buses) {
      const route = ROUTE_LOOKUP.get(bus.routeId);
      if (!route || !route.stopIds.includes(stopId)) continue;

      // Calculate distance along route to this stop
      const distDirect = getDistanceMiles(bus.latitude, bus.longitude, stop.latitude, stop.longitude);
      
      // Calculate realistic ETA in minutes based on distance & route topology
      let minutes = Math.round((distDirect / Math.max(10, bus.speedMph || 15)) * 60);
      if (minutes < 1) minutes = 1;
      const seconds = minutes * 60;

      const isApproaching = distDirect < 0.15 || minutes <= 2;

      arrivals.push({
        busId: bus.id,
        busNumber: bus.busNumber,
        routeId: bus.routeId,
        routeName: route.name,
        routeColor: route.color,
        stopId,
        stopName: stop.name,
        estimatedArrivalTimestamp: this.lastUpdated + seconds * 1000,
        minutesAway: minutes,
        secondsAway: seconds,
        direction: bus.direction,
        isApproaching,
        status: isApproaching ? 'arriving' : 'on_time',
      });
    }

    // Sort by soonest arrival
    return arrivals.sort((a, b) => a.secondsAway - b.secondsAway);
  }

  public subscribeBuses(callback: (buses: Bus[]) => void): () => void {
    this.busListeners.add(callback);
    // Send immediate initial state
    callback(Array.from(this.busStates.values()).map((s) => ({ ...s.bus })));

    return () => {
      this.busListeners.delete(callback);
    };
  }

  public subscribeArrivals(stopId: string, callback: (arrivals: Arrival[]) => void): () => void {
    if (!this.stopListeners.has(stopId)) {
      this.stopListeners.set(stopId, new Set());
    }
    const set = this.stopListeners.get(stopId)!;
    set.add(callback);

    // Immediate calculation
    this.getArrivals(stopId).then(callback);

    return () => {
      set.delete(callback);
      if (set.size === 0) {
        this.stopListeners.delete(stopId);
      }
    };
  }

  public isLiveSource(): boolean {
    return false; // Clearly identifies as DEMO simulation
  }

  public getSourceName(): string {
    return 'Demo Simulation Engine (UA Campus)';
  }

  public getLastUpdated(): number {
    return this.lastUpdated;
  }

  public destroy() {
    if (this.intervalTimer !== null) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    this.busListeners.clear();
    this.stopListeners.clear();
  }
}

// Singleton instance for the app
export const defaultTransitProvider = new DemoTransitDataProvider();
