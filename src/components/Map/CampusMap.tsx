import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { useTransit, UA_CAMPUS_CENTER } from '../../services/transitApi/transitContext';
import { ROUTE_LOOKUP } from '../../data/uaRoutes';
import { STOP_LOOKUP } from '../../data/uaStops';

interface CampusMapProps {
  onMapClickLocation?: (coords: [number, number]) => void;
}

export type MapStyleType = 'streets' | 'outdoor' | 'satellite' | 'voyager';

export const CampusMap: React.FC<CampusMapProps> = ({ onMapClickLocation }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);

  // Layer groups for clean updates
  const routesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const stopsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const busesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const userLocationLayerRef = useRef<L.LayerGroup | null>(null);
  const tripVisualizationLayerRef = useRef<L.LayerGroup | null>(null);

  // References to markers for smooth interpolation
  const busMarkersRef = useRef<Map<string, L.Marker>>(new Map());

  // MapTiler style state
  const [currentStyle, setCurrentStyle] = useState<MapStyleType>('streets');
  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState(false);
  const [mapTilerNotice, setMapTilerNotice] = useState<string | null>(null);

  const {
    routes,
    stops,
    buses,
    selectedRouteId,
    selectedStopId,
    selectedBusId,
    activeTripOption,
    liveTripProgress,
    userLocation,
    selectRoute,
    selectStop,
    selectBus,
    requestUserLocation,
    isLocatingUser,
  } = useTransit();

  // Helper to get tile configuration
  const getTileLayerConfig = useCallback((style: MapStyleType) => {
    // Check environment key or fallback key provided by user
    const maptilerKey = (import.meta.env.VITE_MAPTILER_KEY || '2b0a3871-ae73-4767-b131-3a38324259ed').trim();

    if (style === 'satellite') {
      return {
        url: `https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=${maptilerKey}`,
        options: {
          attribution: '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
          maxZoom: 20,
        },
      };
    } else if (style === 'outdoor') {
      return {
        url: `https://api.maptiler.com/maps/outdoor-v2/{z}/{x}/{y}.png?key=${maptilerKey}`,
        options: {
          attribution: '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
          maxZoom: 20,
        },
      };
    } else if (style === 'streets') {
      return {
        url: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${maptilerKey}`,
        options: {
          attribution: '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
          maxZoom: 20,
        },
      };
    }

    // Default clean CartoDB Voyager fallback
    return {
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      options: {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      },
    };
  }, []);

  // Switch tile layer
  const applyTileStyle = useCallback((style: MapStyleType) => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
    }

    const { url, options } = getTileLayerConfig(style);
    const tileLayer = L.tileLayer(url, options);

    // If MapTiler tiles return an error (e.g. 403 or network issue), smoothly fall back to Voyager
    let errorCount = 0;
    tileLayer.on('tileerror', () => {
      errorCount++;
      if (errorCount === 1 && style !== 'voyager') {
        setMapTilerNotice(
          'MapTiler Cloud key requires allowed origin or token verification. Falling back to high-res campus map.'
        );
        // Switch to voyager without crashing or blank screen
        applyTileStyle('voyager');
        setCurrentStyle('voyager');
      }
    });

    tileLayer.on('load', () => {
      if (style !== 'voyager' && errorCount === 0) {
        setMapTilerNotice(null);
      }
    });

    tileLayer.addTo(map);
    baseTileLayerRef.current = tileLayer;
  }, [getTileLayerConfig]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Create map centered on University of Alabama Quad
    const map = L.map(mapContainerRef.current, {
      center: UA_CAMPUS_CENTER,
      zoom: 15,
      minZoom: 13,
      maxZoom: 19,
      zoomControl: false, // Custom position
      attributionControl: true,
    });

    mapInstanceRef.current = map;

    // Apply initial style
    applyTileStyle('streets');

    // Initialize layer groups
    routesLayerGroupRef.current = L.layerGroup().addTo(map);
    stopsLayerGroupRef.current = L.layerGroup().addTo(map);
    busesLayerGroupRef.current = L.layerGroup().addTo(map);
    tripVisualizationLayerRef.current = L.layerGroup().addTo(map);
    userLocationLayerRef.current = L.layerGroup().addTo(map);

    // Zoom control in bottom-right corner
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Handle map click for manual coordinate selection
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onMapClickLocation) {
        onMapClickLocation([e.latlng.lat, e.latlng.lng]);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [onMapClickLocation, applyTileStyle]);

  // Update Route Polylines
  useEffect(() => {
    const layer = routesLayerGroupRef.current;
    if (!layer || routes.length === 0) return;

    layer.clearLayers();

    // If an active trip is showing, keep route paths subtle so trip route pops out
    const hasActiveTrip = !!activeTripOption;

    routes.forEach((route) => {
      const isSelected = selectedRouteId === route.id;
      const shouldDim = selectedRouteId && !isSelected;

      const polyline = L.polyline(route.shape, {
        color: route.color,
        weight: isSelected ? 6 : hasActiveTrip ? 2.5 : 4,
        opacity: isSelected ? 1.0 : shouldDim ? 0.2 : hasActiveTrip ? 0.35 : 0.75,
        lineCap: 'round',
        lineJoin: 'round',
      });

      polyline.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        selectRoute(route.id);
      });

      polyline.bindTooltip(
        `<div class="font-bold text-xs" style="color: ${route.color}">${route.name}</div><div class="text-[11px] text-slate-500">${route.frequencyMinutes} min frequency</div>`,
        { sticky: true, className: 'custom-leaflet-tooltip' }
      );

      layer.addLayer(polyline);
    });
  }, [routes, selectedRouteId, activeTripOption, selectRoute]);

  // Update Bus Stop Markers
  useEffect(() => {
    const layer = stopsLayerGroupRef.current;
    if (!layer || stops.length === 0) return;

    layer.clearLayers();

    stops.forEach((stop) => {
      const isSelected = selectedStopId === stop.id;
      const isServingSelectedRoute = selectedRouteId
        ? stop.routeIds.includes(selectedRouteId)
        : false;

      // Primary color for stop dot
      const primaryRouteId = stop.routeIds[0];
      const primaryRoute = primaryRouteId ? ROUTE_LOOKUP.get(primaryRouteId) : null;
      const dotColor = primaryRoute ? primaryRoute.color : '#9E1B32';

      const iconHtml = `
        <div class="stop-marker ${isSelected ? 'stop-marker-selected' : ''}" style="--dot-color: ${dotColor}">
          <div class="stop-circle ${isSelected ? 'w-5 h-5 ring-4 ring-red-400 ring-opacity-60 bg-white' : 'w-3.5 h-3.5 bg-white border-2 border-slate-700 shadow-sm'}">
            <div class="w-1.5 h-1.5 rounded-full" style="background-color: ${dotColor}"></div>
          </div>
          ${isSelected ? `<div class="stop-name-tag">${stop.name}</div>` : ''}
        </div>
      `;

      const stopIcon = L.divIcon({
        className: 'custom-stop-divicon',
        html: iconHtml,
        iconSize: isSelected ? [24, 24] : [14, 14],
        iconAnchor: isSelected ? [12, 12] : [7, 7],
      });

      const marker = L.marker([stop.latitude, stop.longitude], {
        icon: stopIcon,
        zIndexOffset: isSelected ? 500 : isServingSelectedRoute ? 200 : 100,
      });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        selectStop(stop.id);
      });

      marker.bindTooltip(
        `<div class="font-bold text-xs text-slate-900">${stop.name}</div><div class="text-[11px] text-slate-500">${stop.routeIds.length} routes serving this stop</div>`,
        { direction: 'top', offset: [0, -10], className: 'custom-leaflet-tooltip' }
      );

      layer.addLayer(marker);
    });
  }, [stops, selectedStopId, selectedRouteId, selectStop]);

  // Update Bus Markers with Heading & Smooth Movement
  useEffect(() => {
    const layer = busesLayerGroupRef.current;
    if (!layer) return;

    const currentBusIds = new Set(buses.map((b) => b.id));

    // Remove old buses
    busMarkersRef.current.forEach((marker, id) => {
      if (!currentBusIds.has(id)) {
        layer.removeLayer(marker);
        busMarkersRef.current.delete(id);
      }
    });

    // Add or update active buses
    buses.forEach((bus) => {
      const isSelected = selectedBusId === bus.id;
      const isRouteSelected = selectedRouteId === bus.routeId;
      const route = ROUTE_LOOKUP.get(bus.routeId);
      const routeColor = route?.color || '#9E1B32';

      const busHtml = `
        <div class="bus-marker-container ${isSelected ? 'bus-marker-active' : ''}">
          <div class="bus-halo ${isSelected ? 'animate-ping' : ''}" style="background-color: ${routeColor}33"></div>
          <div class="bus-body shadow-lg" style="background-color: ${routeColor};">
            <!-- Bus Front Arrow Indicating Direction -->
            <div class="bus-heading-indicator" style="transform: rotate(${bus.heading}deg)">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M14 2L20 12H8L14 2Z" fill="white" opacity="0.9"/>
              </svg>
            </div>
            <!-- Bus Body Icon -->
            <svg class="bus-svg-icon" viewBox="0 0 24 24" width="16" height="16" fill="white">
              <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
            </svg>
            <!-- Badge with Bus Number -->
            <div class="bus-badge font-mono font-bold text-[10px] text-white">#${bus.busNumber}</div>
          </div>
        </div>
      `;

      const busIcon = L.divIcon({
        className: 'custom-bus-divicon',
        html: busHtml,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      let marker = busMarkersRef.current.get(bus.id);
      if (!marker) {
        marker = L.marker([bus.latitude, bus.longitude], {
          icon: busIcon,
          zIndexOffset: isSelected ? 1000 : 700,
        });

        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          selectBus(bus.id);
        });

        marker.bindTooltip(
          `<div class="font-bold text-xs text-slate-900">Bus #${bus.busNumber} (${route?.name || 'Bus'})</div><div class="text-[11px] text-slate-600">${bus.direction}</div><div class="text-[10px] text-slate-400 font-mono mt-0.5">${bus.speedMph} mph · Updated just now</div>`,
          { direction: 'top', offset: [0, -18], className: 'custom-leaflet-tooltip' }
        );

        layer.addLayer(marker);
        busMarkersRef.current.set(bus.id, marker);
      } else {
        // Smoothly animate marker position to current coordinates
        marker.setLatLng([bus.latitude, bus.longitude]);
        marker.setIcon(busIcon);
        marker.setZIndexOffset(isSelected ? 1000 : isRouteSelected ? 850 : 700);
      }
    });
  }, [buses, selectedBusId, selectedRouteId, selectBus]);

  // Update Trip Visualization (Walking + Transit legs)
  useEffect(() => {
    const layer = tripVisualizationLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    if (!activeTripOption) return;

    activeTripOption.legs.forEach((leg, idx) => {
      if (leg.type === 'walk') {
        // Dashed walking line
        const walkLine = L.polyline([leg.fromCoords, leg.toCoords], {
          color: '#475569',
          dashArray: '6, 8',
          weight: 4,
          opacity: 0.85,
        });
        walkLine.bindTooltip(
          `<div class="text-xs font-semibold">Walk (${leg.durationMinutes} min)</div>`,
          { sticky: true }
        );
        layer.addLayer(walkLine);
      } else if (leg.type === 'transit' && leg.pathPolyline) {
        // Vivid transit route polyline
        const transitLine = L.polyline(leg.pathPolyline, {
          color: leg.routeColor || '#9E1B32',
          weight: 7,
          opacity: 0.95,
        });
        transitLine.bindTooltip(
          `<div class="text-xs font-bold" style="color: ${leg.routeColor}">${leg.routeName}</div><div class="text-[11px]">${leg.stopsCount || 3} stops · ~${leg.durationMinutes} min</div>`,
          { sticky: true }
        );
        layer.addLayer(transitLine);
      }

      // Add Start Origin Pin
      if (idx === 0) {
        const originIcon = L.divIcon({
          className: 'custom-origin-divicon',
          html: `<div class="w-6 h-6 rounded-full bg-slate-900 border-2 border-white shadow-md flex items-center justify-center text-white text-[11px] font-bold">A</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        const originMarker = L.marker(leg.fromCoords, { icon: originIcon, zIndexOffset: 900 });
        originMarker.bindTooltip(`<div class="font-bold text-xs">Origin: ${leg.fromName}</div>`, {
          direction: 'top',
        });
        layer.addLayer(originMarker);
      }

      // Add Destination Pin on final leg
      if (idx === activeTripOption.legs.length - 1) {
        const destIcon = L.divIcon({
          className: 'custom-dest-divicon',
          html: `<div class="w-6 h-6 rounded-full bg-[#9E1B32] border-2 border-white shadow-md flex items-center justify-center text-white text-[11px] font-bold">B</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        const destMarker = L.marker(leg.toCoords, { icon: destIcon, zIndexOffset: 900 });
        destMarker.bindTooltip(
          `<div class="font-bold text-xs">Destination: ${leg.toName}</div>`,
          { direction: 'top' }
        );
        layer.addLayer(destMarker);
      }
    });

    // Fit map bounds to show full trip
    if (mapInstanceRef.current && activeTripOption.legs.length > 0) {
      const allCoords: [number, number][] = [];
      activeTripOption.legs.forEach((leg) => {
        allCoords.push(leg.fromCoords);
        allCoords.push(leg.toCoords);
        if (leg.pathPolyline) {
          allCoords.push(...leg.pathPolyline);
        }
      });
      if (allCoords.length > 0) {
        const bounds = L.latLngBounds(allCoords);
        mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
      }
    }
  }, [activeTripOption]);

  // Update User Location Marker
  useEffect(() => {
    const layer = userLocationLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    if (!userLocation) return;

    const userHtml = `
      <div class="user-location-marker">
        <div class="user-pulse"></div>
        <div class="user-core"></div>
      </div>
    `;

    const userIcon = L.divIcon({
      className: 'custom-user-divicon',
      html: userHtml,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const marker = L.marker(userLocation, {
      icon: userIcon,
      zIndexOffset: 1200,
    });
    marker.bindTooltip(
      '<div class="font-bold text-xs text-slate-900">Your Location</div>',
      { direction: 'top' }
    );

    layer.addLayer(marker);
  }, [userLocation]);

  // Fly to selected Stop or Bus when chosen
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (selectedStopId) {
      const stop = STOP_LOOKUP.get(selectedStopId);
      if (stop) {
        mapInstanceRef.current.flyTo([stop.latitude, stop.longitude], 16.5, {
          duration: 0.8,
        });
      }
    } else if (selectedBusId) {
      const bus = buses.find((b) => b.id === selectedBusId);
      if (bus) {
        mapInstanceRef.current.flyTo([bus.latitude, bus.longitude], 16.5, {
          duration: 0.8,
        });
      }
    }
  }, [selectedStopId, selectedBusId, buses]);

  const handleCenterCampus = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(UA_CAMPUS_CENTER, 15, { duration: 0.8 });
    }
  };

  const handleLocateMe = async () => {
    await requestUserLocation();
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(userLocation, 16.5, { duration: 0.8 });
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Leaflet container */}
      <div ref={mapContainerRef} className="w-full h-full z-0 outline-none" />

      {/* Floating Map Controls */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
        <button
          onClick={handleLocateMe}
          disabled={isLocatingUser}
          className="p-2.5 bg-white/95 backdrop-blur-sm text-slate-700 hover:text-slate-900 rounded-lg shadow-md border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center group"
          title="Find My Location"
          aria-label="Find my location"
        >
          {isLocatingUser ? (
            <div className="w-5 h-5 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg
              className="w-5 h-5 group-hover:scale-110 transition-transform text-[#9E1B32]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
          )}
        </button>

        <button
          onClick={handleCenterCampus}
          className="p-2.5 bg-white/95 backdrop-blur-sm text-slate-700 hover:text-slate-900 rounded-lg shadow-md border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center group"
          title="Reset to Campus Center"
          aria-label="Reset to UA campus"
        >
          <svg
            className="w-5 h-5 group-hover:scale-110 transition-transform text-slate-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polygon points="12 8 16 12 12 16 8 12 12 8" />
          </svg>
        </button>

        {/* Map Layers / Style Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsStyleMenuOpen(!isStyleMenuOpen)}
            className="p-2.5 bg-white/95 backdrop-blur-sm text-slate-700 hover:text-slate-900 rounded-lg shadow-md border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center group"
            title="Change Map Style"
            aria-label="Change map style"
          >
            <svg
              className="w-5 h-5 group-hover:scale-110 transition-transform text-slate-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </button>

          {isStyleMenuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-slate-200/90 py-1.5 z-50 text-xs">
              <div className="px-3 py-1 font-bold text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-100">
                Map Styles
              </div>
              <button
                onClick={() => {
                  setCurrentStyle('streets');
                  applyTileStyle('streets');
                  setIsStyleMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                  currentStyle === 'streets' ? 'font-bold text-[#9E1B32] bg-slate-50' : 'text-slate-700'
                }`}
              >
                <span>Streets (MapTiler)</span>
                {currentStyle === 'streets' && <span className="text-xs">✓</span>}
              </button>
              <button
                onClick={() => {
                  setCurrentStyle('outdoor');
                  applyTileStyle('outdoor');
                  setIsStyleMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                  currentStyle === 'outdoor' ? 'font-bold text-[#9E1B32] bg-slate-50' : 'text-slate-700'
                }`}
              >
                <span>Outdoor / Walk</span>
                {currentStyle === 'outdoor' && <span className="text-xs">✓</span>}
              </button>
              <button
                onClick={() => {
                  setCurrentStyle('satellite');
                  applyTileStyle('satellite');
                  setIsStyleMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                  currentStyle === 'satellite' ? 'font-bold text-[#9E1B32] bg-slate-50' : 'text-slate-700'
                }`}
              >
                <span>Satellite Aerial</span>
                {currentStyle === 'satellite' && <span className="text-xs">✓</span>}
              </button>
              <button
                onClick={() => {
                  setCurrentStyle('voyager');
                  applyTileStyle('voyager');
                  setIsStyleMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                  currentStyle === 'voyager' ? 'font-bold text-[#9E1B32] bg-slate-50' : 'text-slate-700'
                }`}
              >
                <span>Transit Clean</span>
                {currentStyle === 'voyager' && <span className="text-xs">✓</span>}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MapTiler Notice Banner if fallback engaged */}
      {mapTilerNotice && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] max-w-md w-full px-4">
          <div className="bg-slate-900/95 text-white backdrop-blur-sm px-3.5 py-2.5 rounded-lg shadow-lg border border-slate-700/80 text-xs flex items-center justify-between gap-3">
            <span className="flex-1 text-[11px] text-slate-200">
              {mapTilerNotice}
            </span>
            <button
              onClick={() => setMapTilerNotice(null)}
              className="text-slate-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Campus Map Legend Pill in bottom left */}
      <div className="hidden sm:flex absolute bottom-4 left-4 z-[400] bg-white/90 backdrop-blur-md px-3 py-2 rounded-lg shadow-sm border border-slate-200/80 items-center gap-3 text-xs text-slate-600">
        <span className="font-semibold text-slate-800">Campus Lines:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#9E1B32]"></span>
          <span>Crimson</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1D4ED8]"></span>
          <span>Blue</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#059669]"></span>
          <span>Green</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]"></span>
          <span>Yellow</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#78350F]"></span>
          <span>Bronze</span>
        </div>
      </div>
    </div>
  );
};
