export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Stop {
  id: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  routeIds: string[];
  description?: string;
  isAccessible?: boolean;
  hasShelter?: boolean;
  bench?: boolean;
}

export interface Route {
  id: string;
  name: string;
  shortName: string;
  color: string; // hex
  textColor: string;
  description: string;
  stopIds: string[];
  shape: [number, number][]; // [latitude, longitude] tuples
  frequencyMinutes: number;
  operatingHours: string;
  directionNames: {
    outbound: string;
    inbound: string;
  };
}

export interface Bus {
  id: string;
  busNumber: string;
  routeId: string;
  latitude: number;
  longitude: number;
  heading: number; // degrees 0-360
  speedMph: number;
  timestamp: number;
  status: 'active' | 'inactive' | 'delayed';
  direction: string;
  nextStopId: string;
  nextStopEtaSeconds: number;
  passengerLoad: 'low' | 'moderate' | 'full';
  segmentIndex: number;
  progressOnSegment: number; // 0..1
}

export interface Arrival {
  busId: string;
  busNumber: string;
  routeId: string;
  routeName: string;
  routeColor: string;
  stopId: string;
  stopName: string;
  estimatedArrivalTimestamp: number;
  minutesAway: number;
  secondsAway: number;
  direction: string;
  isApproaching: boolean;
  status: 'on_time' | 'delayed' | 'arriving';
}

export interface CampusLocation {
  id: string;
  name: string;
  category: 'academic' | 'residence' | 'dining' | 'athletics' | 'library' | 'transit_hub' | 'parking';
  latitude: number;
  longitude: number;
  aliases: string[];
  nearestStopId?: string;
  description?: string;
}

export type TripLegType = 'walk' | 'transit' | 'transfer_wait';

export interface TripLeg {
  type: TripLegType;
  instruction: string;
  durationMinutes: number;
  distanceMiles?: number;
  fromName: string;
  fromCoords: [number, number];
  toName: string;
  toCoords: [number, number];
  // If transit:
  routeId?: string;
  routeName?: string;
  routeColor?: string;
  busId?: string;
  busNumber?: string;
  stopsCount?: number;
  stopsList?: string[];
  departureStopId?: string;
  arrivalStopId?: string;
  scheduledDepartureTime?: string;
  scheduledArrivalTime?: string;
  pathPolyline?: [number, number][];
}

export interface TripOption {
  id: string;
  title: string;
  departureTime: string;
  departureTimestamp: number;
  arrivalTime: string;
  arrivalTimestamp: number;
  totalMinutes: number;
  walkingMinutes: number;
  waitingMinutes: number;
  transitMinutes: number;
  walkingMiles: number;
  transfers: number;
  legs: TripLeg[];
  isBestOption: boolean;
  busWarning?: {
    type: 'tight_connection' | 'missed_current_bus' | 'service_ending_soon';
    message: string;
    nextBusNotice?: string;
  };
  recommendedBusId?: string;
  recommendedBusNumber?: string;
  originStopId?: string;
  destinationStopId?: string;
}

export interface LiveTripProgress {
  trip: TripOption;
  currentLegIndex: number;
  startedAt: number;
  isCompleted: boolean;
  activeBus?: Bus;
  nextStopName?: string;
  stopsRemaining?: number;
  approachingDestination: boolean;
}
