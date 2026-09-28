import { Bus, Route, Stop, TripOption, TripLeg, CampusLocation } from '../../types/transit';
import { UA_ROUTES, ROUTE_LOOKUP } from '../../data/uaRoutes';
import { UA_STOPS, STOP_LOOKUP } from '../../data/uaStops';
import { CAMPUS_LOCATIONS } from '../../data/campusLocations';
import { getDistanceMiles } from '../transitApi/DemoTransitDataProvider';

// Average walking speed: ~3.0 mph => 20 minutes per mile
const WALKING_MINUTES_PER_MILE = 20;

// Format timestamp as "5:24 PM"
export function formatTime(timestampMs: number): string {
  const d = new Date(timestampMs);
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // '0' becomes '12'
  const minStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minStr} ${ampm}`;
}

export function formatMinutesAndSeconds(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export interface RouteRequest {
  originCoords: [number, number];
  originName: string;
  destinationCoords: [number, number];
  destinationName: string;
  departureTime?: number; // timestamp
}

// Find nearest stop to a given coordinate
export function findNearestStops(
  coords: [number, number],
  limit = 3,
  maxDistanceMiles = 0.8
): Array<{ stop: Stop; distanceMiles: number; walkMinutes: number }> {
  const results = UA_STOPS.map((stop) => {
    const dist = getDistanceMiles(coords[0], coords[1], stop.latitude, stop.longitude);
    const walkMinutes = Math.max(1, Math.round(dist * WALKING_MINUTES_PER_MILE));
    return { stop, distanceMiles: dist, walkMinutes };
  })
    .filter((item) => item.distanceMiles <= maxDistanceMiles)
    .sort((a, b) => a.distanceMiles - b.distanceMiles);

  return results.slice(0, limit);
}

/**
 * Natural Language Query Parser for UA Students
 */
export function parseNaturalLanguageQuery(query: string): {
  fromText?: string;
  toText?: string;
  fromLocation?: CampusLocation | Stop;
  toLocation?: CampusLocation | Stop;
} {
  const q = query.trim().toLowerCase();
  let fromText = '';
  let toText = '';

  // Patterns:
  // "how do I get from [X] to [Y]"
  // "from [X] to [Y]"
  // "take me from [X] to [Y]"
  // "directions from [X] to [Y]"
  // "which bus should I take to [Y]"
  // "how do I get to [Y]"
  // "get me to [Y]"
  // "fastest way to get to [Y]"

  const fromToMatch = q.match(/(?:from|starting at|departing)\s+(.*?)\s+(?:to|towards|into)\s+(.*)/i);
  if (fromToMatch) {
    fromText = fromToMatch[1].trim();
    toText = fromToMatch[2].replace(/[?.,!]/g, '').trim();
  } else {
    const toMatch = q.match(/(?:how do i get to|fastest way to get to|which bus should i take to|take me to|get me to|directions to|to)\s+(.*)/i);
    if (toMatch) {
      toText = toMatch[1].replace(/[?.,!]/g, '').trim();
      fromText = 'Current location';
    }
  }

  const findMatch = (text: string): CampusLocation | Stop | undefined => {
    if (!text || text === 'current location' || text === 'where i am') return undefined;

    // Check alias and names
    for (const loc of CAMPUS_LOCATIONS) {
      if (loc.name.toLowerCase().includes(text) || text.includes(loc.name.toLowerCase())) {
        return loc;
      }
      for (const alias of loc.aliases) {
        if (text.includes(alias) || alias.includes(text)) {
          return loc;
        }
      }
    }

    for (const stop of UA_STOPS) {
      if (stop.name.toLowerCase().includes(text) || text.includes(stop.name.toLowerCase())) {
        return stop;
      }
    }

    return undefined;
  };

  return {
    fromText: fromText || undefined,
    toText: toText || undefined,
    fromLocation: fromText ? findMatch(fromText) : undefined,
    toLocation: toText ? findMatch(toText) : undefined,
  };
}

/**
 * Intelligent Multi-Option Trip Planner
 */
export function calculateTrips(
  request: RouteRequest,
  activeBuses: Bus[],
  nowMs: number = Date.now()
): TripOption[] {
  const { originCoords, originName, destinationCoords, destinationName } = request;

  const directDistance = getDistanceMiles(
    originCoords[0],
    originCoords[1],
    destinationCoords[0],
    destinationCoords[1]
  );
  const directWalkMinutes = Math.max(1, Math.round(directDistance * WALKING_MINUTES_PER_MILE));

  const originNearbyStops = findNearestStops(originCoords, 4, 0.7);
  const destNearbyStops = findNearestStops(destinationCoords, 4, 0.7);

  const options: TripOption[] = [];

  // 1. Check for DIRECT bus connections
  for (const originStopItem of originNearbyStops) {
    const oStop = originStopItem.stop;
    const walkToOriginStopMinutes = originStopItem.walkMinutes;

    for (const destStopItem of destNearbyStops) {
      const dStop = destStopItem.stop;
      if (oStop.id === dStop.id) continue;
      const walkFromDestStopMinutes = destStopItem.walkMinutes;

      // Find common routes
      const commonRouteIds = oStop.routeIds.filter((rid) => dStop.routeIds.includes(rid));

      for (const routeId of commonRouteIds) {
        const route = ROUTE_LOOKUP.get(routeId);
        if (!route) continue;

        const oIdx = route.stopIds.indexOf(oStop.id);
        const dIdx = route.stopIds.indexOf(dStop.id);

        if (oIdx === -1 || dIdx === -1 || oIdx === dIdx) continue;

        // Calculate stops count in directional loop
        let stopsCount = 0;
        const stopsList: string[] = [];
        let curr = (oIdx + 1) % route.stopIds.length;
        stopsCount++;
        stopsList.push(STOP_LOOKUP.get(route.stopIds[curr])?.name || 'Next Stop');

        while (curr !== dIdx && stopsCount < route.stopIds.length) {
          curr = (curr + 1) % route.stopIds.length;
          stopsCount++;
          stopsList.push(STOP_LOOKUP.get(route.stopIds[curr])?.name || 'Stop');
        }

        // Ride time estimate (~1.5 min per stop + travel)
        const transitMinutes = Math.max(3, stopsCount * 2);

        // Find best active bus on this route
        const routeBuses = activeBuses.filter((b) => b.routeId === routeId);
        let selectedBus: Bus | undefined;
        let busWaitMinutes = route.frequencyMinutes; // fallback
        let busWarning: TripOption['busWarning'] | undefined;

        if (routeBuses.length > 0) {
          // Check each bus to see if student can catch it
          // Bus ETA to origin stop:
          const busOptions = routeBuses.map((bus) => {
            const dist = getDistanceMiles(bus.latitude, bus.longitude, oStop.latitude, oStop.longitude);
            const busEtaMinutes = Math.max(1, Math.round((dist / Math.max(12, bus.speedMph || 15)) * 60));
            return { bus, busEtaMinutes };
          }).sort((a, b) => a.busEtaMinutes - b.busEtaMinutes);

          const earliestBus = busOptions[0];
          
          // Realistic feasibility check:
          // Can the student walk to the stop before the bus arrives?
          if (earliestBus.busEtaMinutes < walkToOriginStopMinutes) {
            // Student would miss the earliest bus!
            const secondBus = busOptions[1];
            if (secondBus) {
              selectedBus = secondBus.bus;
              busWaitMinutes = secondBus.busEtaMinutes;
              busWarning = {
                type: 'missed_current_bus',
                message: `You will miss Bus #${earliestBus.bus.busNumber} (arrives at ${oStop.name} in ${earliestBus.busEtaMinutes} min, walking takes ${walkToOriginStopMinutes} min).`,
                nextBusNotice: `Next available: Bus #${secondBus.bus.busNumber} arriving in ${secondBus.busEtaMinutes} min.`
              };
            } else {
              selectedBus = earliestBus.bus;
              busWaitMinutes = earliestBus.busEtaMinutes + route.frequencyMinutes;
              busWarning = {
                type: 'missed_current_bus',
                message: `You may miss the approaching Bus #${earliestBus.bus.busNumber}. Recommended next vehicle is arriving in ${busWaitMinutes} min.`
              };
            }
          } else {
            selectedBus = earliestBus.bus;
            busWaitMinutes = earliestBus.busEtaMinutes;
          }
        }

        const waitAtStopMinutes = Math.max(0, busWaitMinutes - walkToOriginStopMinutes);
        const totalMinutes = walkToOriginStopMinutes + waitAtStopMinutes + transitMinutes + walkFromDestStopMinutes;

        const departureTimeMs = nowMs;
        const arrivalTimeMs = nowMs + totalMinutes * 60 * 1000;
        const totalWalkMiles = originStopItem.distanceMiles + destStopItem.distanceMiles;

        const legs: TripLeg[] = [
          {
            type: 'walk',
            instruction: `Walk to ${oStop.name}`,
            durationMinutes: walkToOriginStopMinutes,
            distanceMiles: Number(originStopItem.distanceMiles.toFixed(2)),
            fromName: originName,
            fromCoords: originCoords,
            toName: oStop.name,
            toCoords: [oStop.latitude, oStop.longitude],
          },
          {
            type: 'transit',
            instruction: `Board ${route.name} (${selectedBus ? 'Bus #' + selectedBus.busNumber : 'Next bus'})`,
            durationMinutes: transitMinutes,
            fromName: oStop.name,
            fromCoords: [oStop.latitude, oStop.longitude],
            toName: dStop.name,
            toCoords: [dStop.latitude, dStop.longitude],
            routeId: route.id,
            routeName: route.name,
            routeColor: route.color,
            busId: selectedBus?.id,
            busNumber: selectedBus?.busNumber || '42',
            stopsCount,
            stopsList,
            departureStopId: oStop.id,
            arrivalStopId: dStop.id,
            scheduledDepartureTime: formatTime(nowMs + (walkToOriginStopMinutes + waitAtStopMinutes) * 60000),
            scheduledArrivalTime: formatTime(nowMs + (walkToOriginStopMinutes + waitAtStopMinutes + transitMinutes) * 60000),
            pathPolyline: route.shape,
          },
          {
            type: 'walk',
            instruction: `Get off at ${dStop.name} & walk to ${destinationName}`,
            durationMinutes: walkFromDestStopMinutes,
            distanceMiles: Number(destStopItem.distanceMiles.toFixed(2)),
            fromName: dStop.name,
            fromCoords: [dStop.latitude, dStop.longitude],
            toName: destinationName,
            toCoords: destinationCoords,
          },
        ];

        options.push({
          id: `trip_direct_${route.id}_${oStop.id}_${dStop.id}`,
          title: `${route.shortName} Route (${selectedBus ? 'Bus #' + selectedBus.busNumber : 'Direct'})`,
          departureTime: formatTime(departureTimeMs),
          departureTimestamp: departureTimeMs,
          arrivalTime: formatTime(arrivalTimeMs),
          arrivalTimestamp: arrivalTimeMs,
          totalMinutes,
          walkingMinutes: walkToOriginStopMinutes + walkFromDestStopMinutes,
          waitingMinutes: waitAtStopMinutes,
          transitMinutes,
          walkingMiles: Number(totalWalkMiles.toFixed(2)),
          transfers: 0,
          legs,
          isBestOption: false,
          busWarning,
          recommendedBusId: selectedBus?.id,
          recommendedBusNumber: selectedBus?.busNumber,
          originStopId: oStop.id,
          destinationStopId: dStop.id,
        });
      }
    }
  }

  // 2. Check for 1-TRANSFER connections if no direct or as an alternative
  if (options.length < 3 && originNearbyStops.length > 0 && destNearbyStops.length > 0) {
    const oStop = originNearbyStops[0].stop;
    const dStop = destNearbyStops[0].stop;

    // Potential transfer hubs at UA: Ferguson Student Center, Engineering Quad, Ridgecrest
    const hubs = ['stop_ferguson', 'stop_engineering_quad', 'stop_ridgecrest'].filter(
      (h) => h !== oStop.id && h !== dStop.id
    );

    for (const hubId of hubs) {
      const hubStop = STOP_LOOKUP.get(hubId);
      if (!hubStop) continue;

      const leg1Routes = oStop.routeIds.filter((rid) => hubStop.routeIds.includes(rid));
      const leg2Routes = hubStop.routeIds.filter((rid) => dStop.routeIds.includes(rid));

      if (leg1Routes.length > 0 && leg2Routes.length > 0) {
        const route1 = ROUTE_LOOKUP.get(leg1Routes[0])!;
        const route2 = ROUTE_LOOKUP.get(leg2Routes[0])!;

        if (route1.id !== route2.id) {
          const walk1 = originNearbyStops[0].walkMinutes;
          const wait1 = 3;
          const ride1 = 6;
          const transferWait = 4;
          const ride2 = 7;
          const walk2 = destNearbyStops[0].walkMinutes;
          const totalMin = walk1 + wait1 + ride1 + transferWait + ride2 + walk2;

          const legs: TripLeg[] = [
            {
              type: 'walk',
              instruction: `Walk to ${oStop.name}`,
              durationMinutes: walk1,
              distanceMiles: Number(originNearbyStops[0].distanceMiles.toFixed(2)),
              fromName: originName,
              fromCoords: originCoords,
              toName: oStop.name,
              toCoords: [oStop.latitude, oStop.longitude],
            },
            {
              type: 'transit',
              instruction: `Board ${route1.name} to ${hubStop.name}`,
              durationMinutes: ride1,
              fromName: oStop.name,
              fromCoords: [oStop.latitude, oStop.longitude],
              toName: hubStop.name,
              toCoords: [hubStop.latitude, hubStop.longitude],
              routeId: route1.id,
              routeName: route1.name,
              routeColor: route1.color,
              busNumber: '18',
              stopsCount: 3,
              pathPolyline: route1.shape,
            },
            {
              type: 'transfer_wait',
              instruction: `Transfer at ${hubStop.name} to ${route2.name}`,
              durationMinutes: transferWait,
              fromName: hubStop.name,
              fromCoords: [hubStop.latitude, hubStop.longitude],
              toName: hubStop.name,
              toCoords: [hubStop.latitude, hubStop.longitude],
            },
            {
              type: 'transit',
              instruction: `Board ${route2.name} to ${dStop.name}`,
              durationMinutes: ride2,
              fromName: hubStop.name,
              fromCoords: [hubStop.latitude, hubStop.longitude],
              toName: dStop.name,
              toCoords: [dStop.latitude, dStop.longitude],
              routeId: route2.id,
              routeName: route2.name,
              routeColor: route2.color,
              busNumber: '42',
              stopsCount: 4,
              pathPolyline: route2.shape,
            },
            {
              type: 'walk',
              instruction: `Walk to ${destinationName}`,
              durationMinutes: walk2,
              distanceMiles: Number(destNearbyStops[0].distanceMiles.toFixed(2)),
              fromName: dStop.name,
              fromCoords: [dStop.latitude, dStop.longitude],
              toName: destinationName,
              toCoords: destinationCoords,
            },
          ];

          options.push({
            id: `trip_transfer_${route1.id}_${route2.id}`,
            title: `${route1.shortName} → ${route2.shortName} (Transfer at ${hubStop.name})`,
            departureTime: formatTime(nowMs),
            departureTimestamp: nowMs,
            arrivalTime: formatTime(nowMs + totalMin * 60000),
            arrivalTimestamp: nowMs + totalMin * 60000,
            totalMinutes: totalMin,
            walkingMinutes: walk1 + walk2,
            waitingMinutes: wait1 + transferWait,
            transitMinutes: ride1 + ride2,
            walkingMiles: Number((originNearbyStops[0].distanceMiles + destNearbyStops[0].distanceMiles).toFixed(2)),
            transfers: 1,
            legs,
            isBestOption: false,
            originStopId: oStop.id,
            destinationStopId: dStop.id,
          });
          break;
        }
      }
    }
  }

  // 3. Direct Walking Option (especially helpful if very close or for comparison)
  if (directDistance <= 1.2) {
    options.push({
      id: 'trip_walking_direct',
      title: 'Direct Campus Walk',
      departureTime: formatTime(nowMs),
      departureTimestamp: nowMs,
      arrivalTime: formatTime(nowMs + directWalkMinutes * 60000),
      arrivalTimestamp: nowMs + directWalkMinutes * 60000,
      totalMinutes: directWalkMinutes,
      walkingMinutes: directWalkMinutes,
      waitingMinutes: 0,
      transitMinutes: 0,
      walkingMiles: Number(directDistance.toFixed(2)),
      transfers: 0,
      legs: [
        {
          type: 'walk',
          instruction: `Walk directly across campus from ${originName} to ${destinationName}`,
          durationMinutes: directWalkMinutes,
          distanceMiles: Number(directDistance.toFixed(2)),
          fromName: originName,
          fromCoords: originCoords,
          toName: destinationName,
          toCoords: destinationCoords,
        },
      ],
      isBestOption: false,
    });
  }

  // Sort options:
  // 1. Earliest arrival (totalMinutes)
  // 2. Least transfers
  // 3. Walking distance
  options.sort((a, b) => {
    if (a.transfers !== b.transfers) {
      return a.transfers - b.transfers;
    }
    return a.totalMinutes - b.totalMinutes;
  });

  // Mark best option
  if (options.length > 0) {
    options[0].isBestOption = true;
  }

  return options.slice(0, 3);
}
