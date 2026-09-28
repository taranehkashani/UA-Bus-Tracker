import { Bus, Route, Stop, Arrival } from '../../types/transit';

export interface TransitDataProvider {
  /**
   * Returns all active routes.
   */
  getRoutes(): Promise<Route[]>;

  /**
   * Returns all transit stops.
   */
  getStops(): Promise<Stop[]>;

  /**
   * Returns current active bus positions and telemetry.
   */
  getBuses(): Promise<Bus[]>;

  /**
   * Returns upcoming bus arrivals for a specific stop.
   */
  getArrivals(stopId: string): Promise<Arrival[]>;

  /**
   * Subscribes to live/simulated bus updates.
   * Returns an unsubscribe function.
   */
  subscribeBuses(callback: (buses: Bus[]) => void): () => void;

  /**
   * Subscribes to arrival updates for a specific stop.
   */
  subscribeArrivals(stopId: string, callback: (arrivals: Arrival[]) => void): () => void;

  /**
   * Identifies whether current stream is live GPS from UA feeds or realistic simulation.
   */
  isLiveSource(): boolean;

  /**
   * Source identifier name (e.g. "Demo Simulation Engine (UA Campus)", "UA TransLoc/TripShot API").
   */
  getSourceName(): string;

  /**
   * Timestamp of the most recent data reception.
   */
  getLastUpdated(): number;
}
