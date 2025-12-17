import React, { useEffect, useRef, useState, useMemo } from "react";
import { MapContainer, TileLayer, useMap, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import Routing from './Routing';

type DestinationType = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  type: string;
  tripsPerWeek: number;
  travelTime: string;
  availableTrucks: number;
  lat?: number;
  lng?: number;
};

const DEFAULT_CENTER: [number, number] = [8.0, 125.0]; // center of Mindanao

// haversine distance (meters)
const mapDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// compute a lat/lng point along provided route coords by fraction [0..1]
const pointAlongRoute = (coords: Array<[number, number]>, frac: number) => {
  if (!coords || coords.length === 0) return null;
  // coords may be [lng,lat] from OSRM/routing-machine; normalize to [lat,lng]
  const latlngs = coords.map((c) => ({ lat: c[1], lng: c[0] }));
  // compute cumulative distances
  const segLens: number[] = [];
  let total = 0;
  for (let i = 0; i < latlngs.length - 1; i++) {
    const a = latlngs[i];
    const b = latlngs[i + 1];
    const d = mapDistance(a.lat, a.lng, b.lat, b.lng);
    segLens.push(d);
    total += d;
  }
  if (total === 0) return latlngs[0];
  const target = Math.max(0, Math.min(1, frac)) * total;
  let acc = 0;
  for (let i = 0; i < segLens.length; i++) {
    const l = segLens[i];
    if (acc + l >= target) {
      const within = (target - acc) / l;
      const a = latlngs[i];
      const b = latlngs[i + 1];
      return { lat: a.lat + (b.lat - a.lat) * within, lng: a.lng + (b.lng - a.lng) * within };
    }
    acc += l;
  }
  return latlngs[latlngs.length - 1];
};

const MarkerClusterLayer: React.FC<{ destinations: DestinationType[]; devForceRebuild?: boolean }> = ({ destinations, devForceRebuild = false }) => {
  const map = useMap();
  const layerRef = useRef<any>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const didInitialRef = useRef(false);

  useEffect(() => {
    if (!map) return;

    // create cluster group if missing
    if (!layerRef.current) {
      layerRef.current = (L as any).markerClusterGroup();
      layerRef.current.addTo(map);
    }

    const cluster: any = layerRef.current;

    // track latlngs for initial fit
    const latlngs: [number, number][] = [];

    // add or update markers
    destinations.forEach((d) => {
      if (typeof d.lat !== "number" || typeof d.lng !== "number") return;
      latlngs.push([d.lat as number, d.lng as number]);
      const existing = markersRef.current[d.id];
      if (existing) {
        // move existing marker and force cluster to refresh the marker position
        try { existing.setLatLng([d.lat, d.lng]); } catch (e) {}
        try {
          // remove and re-add so cluster recalculates
          if (cluster && typeof cluster.removeLayer === 'function' && typeof cluster.addLayer === 'function') {
            cluster.removeLayer(existing);
            cluster.addLayer(existing);
          }
        } catch (e) {}
      } else {
        const marker = L.marker([d.lat, d.lng]);
        const popupHtml = `<div style="min-width:160px"><strong>${d.name}</strong><br/>${d.address}<br/><a href=\"/destinations/${d.id}\">View</a></div>`;
        marker.bindPopup(popupHtml);
        markersRef.current[d.id] = marker;
        try { cluster.addLayer(marker); } catch (e) {}
      }
    });

    // ensure cluster refresh so moved markers repaint properly
    try {
      if (typeof cluster.refreshClusters === 'function') cluster.refreshClusters();
      else if (typeof cluster.repaint === 'function') cluster.repaint();
      else if (typeof cluster.redraw === 'function') cluster.redraw();
    } catch (e) {}

    // remove markers that no longer exist
    Object.keys(markersRef.current).forEach((id) => {
      if (!destinations.find((d) => String(d.id) === String(id))) {
        try { cluster.removeLayer(markersRef.current[id]); } catch (e) {}
        try { map.removeLayer(markersRef.current[id]); } catch (e) {}
        delete markersRef.current[id];
      }
    });

    // initial fit bounds
    if (!didInitialRef.current) {
      if (latlngs.length) {
        try {
          const bounds = L.latLngBounds(latlngs as any);
          map.fitBounds(bounds.pad(0.2));
        } catch (e) {
          try { map.setView(DEFAULT_CENTER, 4); } catch (e) {}
        }
      } else {
        try { map.setView(DEFAULT_CENTER, 4); } catch (e) {}
      }
      didInitialRef.current = true;
    }

    // optional dev-mode rebuild interval to force cluster recalculation
    let rebuildId: number | null = null;
    if (devForceRebuild) {
      try {
        rebuildId = window.setInterval(() => {
          try {
            // remove all layers then re-add
            Object.values(markersRef.current).forEach((m) => { try { cluster.removeLayer(m); } catch (e) {} });
            Object.values(markersRef.current).forEach((m) => { try { cluster.addLayer(m); } catch (e) {} });
            if (typeof cluster.refreshClusters === 'function') cluster.refreshClusters();
            else if (typeof cluster.repaint === 'function') cluster.repaint();
            else if (typeof cluster.redraw === 'function') cluster.redraw();
          } catch (e) {}
        }, 1000) as unknown as number;
      } catch (e) { rebuildId = null; }
    }

    return () => {
      if (rebuildId) clearInterval(rebuildId);
      // do not destroy cluster on each update; keep markersRef for reuse
    };
  }, [destinations, map]);

  return null;
};

const DestinationMap: React.FC<{ destinations: DestinationType[]; wsUrl?: string; focusPosition?: { lat: number; lng: number } | null; focusLabel?: string | null; focusedTrip?: any | null; devForceRebuild?: boolean }> = ({ destinations: initial, wsUrl = "ws://localhost:8082", focusPosition = null, focusLabel = null, focusedTrip = null, devForceRebuild = false }) => {
  const [destinations, setDestinations] = useState<DestinationType[]>(initial);
  const [clientPositions, setClientPositions] = useState<Record<string, { lat: number; lng: number }>>({});
  // store route coordinates per trip id (coords are [lng, lat])
  const routeCoordsByTripRef = useRef<Record<string, Array<[number, number]>>>({});
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => setDestinations(initial), [initial]);

  useEffect(() => {
    let shouldStop = false;
    let retry = 1000;

    const connect = () => {
      // guard: avoid opening multiple sockets if one already exists
      if (wsRef.current) return;
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.debug("[DestinationMap] WS open", wsUrl);
          retry = 1000;
        };

        ws.onmessage = (ev) => {
          console.debug("[DestinationMap] WS message", ev.data);
          try {
            const msg = JSON.parse(ev.data);
            if (msg.type === "destination-update") {
              setDestinations((prev) => prev.map((d) => (d.id === msg.id ? { ...d, ...msg.payload } : d)));
            } else if (msg.type === "position-update") {
              setDestinations((prev) => prev.map((d) => (d.id === msg.id ? { ...d, lat: msg.lat, lng: msg.lng } : d)));
            } else if (msg.type === "client-position") {
              if (msg.clientId && typeof msg.lat === 'number' && typeof msg.lng === 'number') {
                setClientPositions((prev) => ({ ...prev, [msg.clientId]: { lat: msg.lat, lng: msg.lng } }));
              }
            }
          } catch (e) {
            console.debug("[DestinationMap] WS message parse error", e);
          }
        };

        ws.onclose = () => {
          wsRef.current = null;
          if (!shouldStop) {
            retry = Math.min(30000, Math.floor(retry * 1.5));
            setTimeout(connect, retry);
          }
        };

        ws.onerror = (ev) => {
          console.debug("[DestinationMap] WS error", ev);
          try { ws.close(); } catch (e) {}
        };
      } catch (e) {
        if (!shouldStop) setTimeout(connect, retry);
      }
    };

    connect();
    return () => {
      shouldStop = true;
      if (wsRef.current) wsRef.current.close();
    };
  }, [wsUrl]);

  // Simulation: read trips from localStorage and animate truck positions client-side (linear interpolation)
  useEffect(() => {
    let mounted = true;
    const getTrips = (): any[] => {
      try {
        const raw = localStorage.getItem('trips');
        if (!raw) return [];
        const parsed = JSON.parse(raw) as any[];
        return parsed.map((t) => ({
          ...t,
          startTime: t.startTime ? new Date(t.startTime) : undefined,
          endTime: t.endTime ? new Date(t.endTime) : undefined,
        }));
      } catch (e) {
        return [];
      }
    };

    const tick = () => {
      const trips = getTrips();
      const now = Date.now();
      const positions: Record<string, { lat: number; lng: number }> = {};

      trips.forEach((trip) => {
        // Only animate trips that are in transit
        if (trip.status !== 'intransit') return;
        
        // require coordinates
        const oLat = trip.originLat ?? trip.origin?.lat;
        const oLng = trip.originLng ?? trip.origin?.lng;
        const dLat = trip.destLat ?? trip.destination?.lat;
        const dLng = trip.destLng ?? trip.destination?.lng;
        if (typeof oLat !== 'number' || typeof oLng !== 'number' || typeof dLat !== 'number' || typeof dLng !== 'number') return;

        const start = trip.startTime ? new Date(trip.startTime).getTime() : now;
        const end = trip.endTime ? new Date(trip.endTime).getTime() : (start + 60 * 60 * 1000); // default 1h

        // compute fraction [0,1]
        const frac = Math.max(0, Math.min(1, (now - start) / Math.max(1, end - start)));

        // If we have a route for this trip (or truck), follow the route geometry; otherwise fallback to linear interpolation
        const routeForTrip = (() => {
          try {
            return routeCoordsByTripRef.current[String(trip.id)] || routeCoordsByTripRef.current[String(trip.truckId)];
          } catch (e) { return undefined; }
        })();

        let posLat = oLat + (dLat - oLat) * frac;
        let posLng = oLng + (dLng - oLng) * frac;
        if (routeForTrip && Array.isArray(routeForTrip) && routeForTrip.length) {
          try {
            const pt = (pointAlongRoute as any)(routeForTrip, frac);
            if (pt && typeof pt.lat === 'number' && typeof pt.lng === 'number') {
              posLat = pt.lat;
              posLng = pt.lng;
            }
          } catch (e) {}
        }

        // key by truck id if available, else trip id
        const key = String(trip.truckId || trip.id || `trip-${Math.random().toString(36).slice(2,8)}`);
        positions[key] = { lat: posLat, lng: posLng };
      });

      if (mounted) setClientPositions(positions);
    };

    // initial tick and interval - update every 2 seconds for smoother animation
    tick();
    const id = window.setInterval(tick, 2000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  // compute an initial center from the incoming `initial` prop and keep it stable
  const initialCenter = useMemo<[number, number]>(() => {
    const src = Array.isArray(initial) && initial.length ? initial : destinations;
    const valid = src.filter((d) => typeof d.lat === "number" && typeof d.lng === "number");
    if (valid.length) return [valid[0].lat as number, valid[0].lng as number] as [number, number];
    return DEFAULT_CENTER;
  }, [initial]);

  // route coords received from Routing component (array of [lng, lat] or [lon,lat] from routing-machine)
  const [routeCoordsState, setRouteCoordsState] = useState<Array<[number, number]>>([]);

  return (
    <div className="rounded-md overflow-hidden border">
      <MapContainer center={initialCenter} zoom={6} style={{ height: "360px", width: "100%" }} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RouteLayer focusedTripId={focusedTrip?.id} onSetRouteCoordsForTrip={(tripId: string, coords: Array<[number, number]>) => {
          try { routeCoordsByTripRef.current = { ...routeCoordsByTripRef.current, [tripId]: coords }; } catch (e) {}
          try {
            // if this route belongs to the currently focused trip (or its truck), expose it to the MoveAlongRouteLayer
            if (focusedTrip && (String(tripId) === String(focusedTrip.id) || String(tripId) === String(focusedTrip.truckId))) {
              setRouteCoordsState(coords);
            }
          } catch (e) {}
        }} />
        <MarkerClusterLayer destinations={destinations} devForceRebuild={devForceRebuild} />
        {Object.keys(clientPositions).length > 0 && (
          <ClientMarkerLayer clients={clientPositions} routeCoordsByTripRef={routeCoordsByTripRef} skipId={focusedTrip?.truckId ? String(focusedTrip.truckId) : undefined} />
        )}
        {/* origin/destination tiny pins for focused trip */}
        {(() => {
          try {
            if (!focusedTrip) return null;
            const oLat = focusedTrip.originLat ?? focusedTrip.origin?.lat;
            const oLng = focusedTrip.originLng ?? focusedTrip.origin?.lng;
            const dLat = focusedTrip.destLat ?? focusedTrip.destination?.lat;
            const dLng = focusedTrip.destLng ?? focusedTrip.destination?.lng;
            if (typeof oLat === 'number' && typeof oLng === 'number' && typeof dLat === 'number' && typeof dLng === 'number') {
              return (
                <>
                  <Marker position={[oLat, oLng]} />
                  <Marker position={[dLat, dLng]} />
                </>
              );
            }
          } catch (e) {}
          return null;
        })()}
        {/* animated moving marker that follows routeCoordsState when focusedTrip exists */}
        {focusedTrip && routeCoordsState && routeCoordsState.length > 0 && (
          <MoveAlongRouteLayer trip={focusedTrip} routeCoords={routeCoordsState} />
        )}
        {focusPosition && <MapFocusSetter focusPosition={focusPosition} />}
        {focusPosition && <FocusMarkerLayer position={focusPosition} label={focusLabel || ''} />}
        {focusedTrip && focusedTrip.originLat != null && focusedTrip.destLat != null && (
          <Routing
            origin={{ lat: focusedTrip.originLat ?? focusedTrip.origin?.lat, lng: focusedTrip.originLng ?? focusedTrip.origin?.lng }}
            destination={{ lat: focusedTrip.destLat ?? focusedTrip.destination?.lat, lng: focusedTrip.destLng ?? focusedTrip.destination?.lng }}
            lineColor={focusedTrip.status === 'intransit' ? '#0369a1' : focusedTrip.status === 'pending' ? '#f59e0b' : focusedTrip.status === 'completed' ? '#10b981' : '#ef4444'}
            setRouteCoords={(coords) => {
              try { setRouteCoordsState && setRouteCoordsState(coords); } catch (e) {}
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};

const FocusRoutingControl: React.FC<{ trip: any }> = ({ trip }) => {
  const map = useMap();
  const ctrlRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !trip) return;
    try {
      const oLat = trip.originLat ?? trip.origin?.lat;
      const oLng = trip.originLng ?? trip.origin?.lng;
      const dLat = trip.destLat ?? trip.destination?.lat;
      const dLng = trip.destLng ?? trip.destination?.lng;
      if (typeof oLat !== 'number' || typeof oLng !== 'number' || typeof dLat !== 'number' || typeof dLng !== 'number') return;

      // remove existing
      if (ctrlRef.current) {
        try { ctrlRef.current.remove(); } catch (e) {}
        ctrlRef.current = null;
      }

      const styles = [{ color: trip.status === 'intransit' ? '#0369a1' : trip.status === 'pending' ? '#f59e0b' : trip.status === 'completed' ? '#10b981' : '#ef4444', weight: 6 }];

      if (!(L as any).Routing) return;
      const control = (L as any).Routing.control({
        waypoints: [L.latLng(oLat, oLng), L.latLng(dLat, dLng)],
        lineOptions: { styles },
        show: false,
        routeWhileDragging: false,
        draggableWaypoints: false,
        addWaypoints: false,
        createMarker: (i: number, wp: any, n: number) => {
          const marker = L.marker(wp.latLng);
          if (i === n - 1) marker.bindPopup(`Destination`);
          return marker;
        }
      }).addTo(map);

      ctrlRef.current = control;

      return () => {
        try { if (ctrlRef.current) ctrlRef.current.remove(); } catch (e) {}
        ctrlRef.current = null;
      };
    } catch (e) {}
  }, [map, trip]);

  return null;
};

const FocusMarkerLayer: React.FC<{ position: { lat: number; lng: number }; label?: string }> = ({ position, label = '' }) => {
  const map = useMap();
  const markerRef = React.useRef<L.Marker | null>(null);
  const didInitialRef = React.useRef(false);

  useEffect(() => {
    if (!map) return;

    // create marker once (or recreate if removed)
    if (!markerRef.current) {
      const marker = L.marker([position.lat, position.lng], { icon: createDeviceIcon(label), interactive: false });
      marker.addTo(map);
      try { marker.setZIndexOffset(1000); } catch (e) {}
      markerRef.current = marker;

      // center map the first time we show the marker
      if (!didInitialRef.current) {
        try { map.setView([position.lat, position.lng], Math.max(map.getZoom(), 12), { animate: true }); } catch (e) {}
        didInitialRef.current = true;
      }

      // marker added without bounce
    }

    // On zoom/move, ensure marker stays on top and retains classes (do NOT change its lat/lng)
    const onViewChange = () => {
      try {
        if (markerRef.current) {
          try { markerRef.current.setZIndexOffset(1000); } catch (e) {}
          // keep marker on top; no bounce
        }
      } catch (e) {}
    };
    map.on('zoomend moveend', onViewChange);

    return () => {
      try { map.off('zoomend moveend', onViewChange); } catch (e) {}
      try { if (markerRef.current) map.removeLayer(markerRef.current); } catch (e) {}
      markerRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    if (!markerRef.current) return;
    // move marker to new position, but do not recenter map on every update
    try {
      markerRef.current.setLatLng([position.lat, position.lng]);
    } catch (e) {}
  }, [position]);

  return null;
};

const MapFocusSetter: React.FC<{ focusPosition: { lat: number; lng: number } }> = ({ focusPosition }) => {
  const map = useMap();
  useEffect(() => {
    if (!map || !focusPosition) return;
    try {
      map.setView([focusPosition.lat, focusPosition.lng], 12, { animate: true });
    } catch (e) {}
  }, [map, focusPosition]);
  return null;
};

const createDeviceIcon = (label?: string) => {
  // Use a compact truck-like pin with embedded bounce CSS.
  const html = `
    <style>
      .device-pin{display:inline-block;line-height:1;transform-origin:center bottom}
      .device-pin-inner{display:block}
      .device-pin-label{font-size:10px;color:#111;text-align:center;margin-top:2px}
    </style>
    <div class="device-pin" role="img" aria-label="pin">
      <svg viewBox="0 0 48 64" xmlns="http://www.w3.org/2000/svg" width="36" height="48" class="device-pin-inner" aria-hidden="true">
        <defs>
          <radialGradient id="pinGrad" cx="30%" cy="30%">
            <stop offset="0%" stop-color="#fff" stop-opacity="0.9" />
            <stop offset="60%" stop-color="#ef4444" />
            <stop offset="100%" stop-color="#be123c" />
          </radialGradient>
        </defs>
        <!-- pin head -->
        <path d="M24 4 C14 4 8 12 8 22 C8 34 24 54 24 54 C24 54 40 34 40 22 C40 12 34 4 24 4 Z" fill="url(#pinGrad)" stroke="#9f1239" stroke-width="0.5" />
        <!-- inner circle -->
        <circle cx="24" cy="22" r="8" fill="#fff" opacity="0.9" />
        <circle cx="24" cy="22" r="5" fill="#ef4444" />
        <!-- shadow base -->
        <ellipse cx="24" cy="58" rx="10" ry="3" fill="#000" opacity="0.15" />
      </svg>
      <div class="device-pin-label">${label || ""}</div>
    </div>
  `;

  return L.divIcon({
    className: "device-pin",
    html,
    iconSize: [36, 48],
    iconAnchor: [18, 44],
  });
};

const ClientMarkerLayer: React.FC<{ clients: Record<string, { lat: number; lng: number }>; routeCoordsByTripRef?: React.RefObject<Record<string, Array<[number, number]>>>; skipId?: string | undefined }> = ({ clients, routeCoordsByTripRef, skipId }) => {
  const map = useMap();
  const markersRef = useRef<Record<string, L.Marker>>({});
  const animRef = useRef<Record<string, { raf?: number; start?: number }>>({});

  useEffect(() => {
    if (!map) return;

    // Add or update markers
    Object.entries(clients).forEach(([id, p]) => {
      // If this client/truck is the focused one, let MoveAlongRouteLayer render the single marker on the route
      if (skipId && String(id) === String(skipId)) {
        // remove any existing marker rendered by this layer for that id
        if (markersRef.current[id]) {
          try { map.removeLayer(markersRef.current[id]); } catch (e) {}
          delete markersRef.current[id];
        }
        return;
      }
      const targetLatLng = L.latLng(p.lat, p.lng);
      let marker = markersRef.current[id];

      if (!marker) {
        marker = L.marker([p.lat, p.lng], { icon: createDeviceIcon(id) }).bindPopup(`Truck ${id}`);
        marker.addTo(map);
        try { marker.setZIndexOffset(1500); } catch (e) {}
        markersRef.current[id] = marker;
        return;
      }

      // Cancel previous animation for this marker
      if (animRef.current[id] && animRef.current[id].raf) {
        cancelAnimationFrame(animRef.current[id].raf!);
      }

      const from = marker.getLatLng();
      const duration = 2000; // ms - smooth 2 second movement to match update interval
      const start = performance.now();
      animRef.current[id] = { start };

      // animate position smoothly (no bounce)
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        // Use easing for smoother movement
        const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const lat = from.lat + (targetLatLng.lat - from.lat) * eased;
        const lng = from.lng + (targetLatLng.lng - from.lng) * eased;
        marker!.setLatLng([lat, lng]);
        if (t < 1) {
          animRef.current[id].raf = requestAnimationFrame(step);
        } else {
          // finished moving
          delete animRef.current[id];
        }
      };

      animRef.current[id].raf = requestAnimationFrame(step);
    });

    // Remove markers that no longer exist
    Object.keys(markersRef.current).forEach((id) => {
      if (!(id in clients)) {
        try { map.removeLayer(markersRef.current[id]); } catch (e) {}
        delete markersRef.current[id];
        if (animRef.current[id] && animRef.current[id].raf) cancelAnimationFrame(animRef.current[id].raf!);
        delete animRef.current[id];
      }
    });

    // cleanup on unmount
    return () => {
      Object.values(markersRef.current).forEach((m) => { try { map.removeLayer(m); } catch (e) {} });
      Object.values(animRef.current).forEach((a) => { if (a.raf) cancelAnimationFrame(a.raf); });
      markersRef.current = {};
      animRef.current = {};
    };
  }, [clients, map]);

  return null;
};

const RouteLayer: React.FC<{ focusedTripId?: string | null; onSetRouteCoordsForTrip?: (tripId: string, coords: Array<[number, number]>) => void }> = ({ focusedTripId = null, onSetRouteCoordsForTrip }) => {
  const map = useMap();
  const layerRef = React.useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!map) return;

    // Clear existing
    if (layerRef.current) {
      try { map.removeLayer(layerRef.current); } catch (e) {}
      layerRef.current = null;
    }

    const group = L.layerGroup();
    const controllers: AbortController[] = [];

    const drawTripRoute = async (trip: any) => {
      const oLat = trip.originLat ?? trip.origin?.lat;
      const oLng = trip.originLng ?? trip.origin?.lng;
      const dLat = trip.destLat ?? trip.destination?.lat;
      const dLng = trip.destLng ?? trip.destination?.lng;
      if (typeof oLat !== 'number' || typeof oLng !== 'number' || typeof dLat !== 'number' || typeof dLng !== 'number') return;

      const isFocused = focusedTripId && String(trip.id) === String(focusedTripId);

      // If not focused, draw muted/thin gray fallback so map isn't visually noisy.
      let color = '#9CA3AF'; // muted gray
      let dashArray: string | undefined = undefined;
      let weight = 2;
      let opacity = 0.6;

      if (isFocused) {
        weight = 4;
        opacity = 0.95;
        // colored styles only for focused trip
        if (trip.status === 'intransit') { color = '#0369a1'; }
        else if (trip.status === 'pending') { color = '#f59e0b'; dashArray = '6,8'; }
        else if (trip.status === 'completed') { color = '#10b981'; }
        else if (trip.status === 'cancelled') { color = '#ef4444'; dashArray = '4,6'; }
        else { color = '#3b82f6'; }
      }

      // Try OSRM route for road-following geometry
      const ctrl = new AbortController();
      controllers.push(ctrl);
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson`;
          const res = await fetch(url, { signal: ctrl.signal });
          if (!res.ok) throw new Error('OSRM fetch failed');
          const data = await res.json();
          const coords: any[] = data?.routes?.[0]?.geometry?.coordinates;
          if (Array.isArray(coords) && coords.length) {
            const latlngs = coords.map((c: any) => [c[1], c[0]] as [number, number]);
            const poly = L.polyline(latlngs, { color, weight, opacity, dashArray });
            poly.addTo(group);
            // provide coords normalized as [lng, lat] back to parent
            try {
              if (onSetRouteCoordsForTrip) onSetRouteCoordsForTrip(String(trip.id), coords.map((c: any) => [c[0], c[1]] as [number, number]));
              if (trip.truckId && onSetRouteCoordsForTrip) onSetRouteCoordsForTrip(String(trip.truckId), coords.map((c: any) => [c[0], c[1]] as [number, number]));
            } catch (e) {}
            return;
          }
        } catch (e) {
          // fallthrough to straight line fallback
        }

      // Fallback: straight line
      try {
        const poly = L.polyline([[oLat, oLng], [dLat, dLng]], { color, weight, opacity, dashArray });
        poly.addTo(group);
        try {
          if (onSetRouteCoordsForTrip) onSetRouteCoordsForTrip(String(trip.id), [[oLng, oLat], [dLng, dLat]]);
          if (trip.truckId && onSetRouteCoordsForTrip) onSetRouteCoordsForTrip(String(trip.truckId), [[oLng, oLat], [dLng, dLat]]);
        } catch (e) {}
      } catch (e) {}
    };

    try {
      const raw = localStorage.getItem('trips');
      if (raw) {
        const arr = JSON.parse(raw) as any[];
        // draw each trip (async) but don't await sequentially to avoid blocking
        arr.forEach((trip) => { void drawTripRoute(trip); });
      }
    } catch (e) {}

    group.addTo(map);
    layerRef.current = group;

    return () => {
      // abort any pending OSRM requests
      controllers.forEach((c) => { try { c.abort(); } catch (e) {} });
      try { if (layerRef.current) map.removeLayer(layerRef.current); } catch (e) {}
      layerRef.current = null;
    };
  }, [map]);

  return null;
};

export default DestinationMap;

const MoveAlongRouteLayer: React.FC<{ trip: any; routeCoords: Array<[number, number]> }> = ({ trip, routeCoords }) => {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);
  const polyRef = useRef<L.Polyline | null>(null);
  const rafRef = useRef<number | null>(null);

  // compute fraction based on trip start/end
  const fraction = () => {
    try {
      const now = Date.now();
      const start = trip.startTime ? new Date(trip.startTime).getTime() : now;
      const end = trip.endTime ? new Date(trip.endTime).getTime() : (start + 60 * 60 * 1000);
      return Math.max(0, Math.min(1, (now - start) / Math.max(1, end - start)));
    } catch (e) { return 0; }
  };

  useEffect(() => {
    if (!map || !routeCoords || routeCoords.length === 0) return;

    // draw route polyline for visibility (coords are [lng, lat])
    try {
      if (polyRef.current) {
        try { map.removeLayer(polyRef.current); } catch (e) {}
        polyRef.current = null;
      }
      const latlngs = routeCoords.map((c) => [c[1], c[0]] as [number, number]);
      const color = trip.status === 'intransit' ? '#0369a1' : trip.status === 'pending' ? '#f59e0b' : trip.status === 'completed' ? '#10b981' : '#ef4444';
      const poly = L.polyline(latlngs, { color, weight: 4, opacity: 0.95 });
      poly.addTo(map);
      polyRef.current = poly;
    } catch (e) {}

    // create marker once
    if (!markerRef.current) {
      const p = routeCoords[0];
      const lat = p[1];
      const lng = p[0];
      const m = L.marker([lat, lng], { icon: createDeviceIcon(String(trip.truckId || trip.id || '')), interactive: false });
      m.addTo(map);
      try { m.setZIndexOffset(2000); } catch (e) {}
      markerRef.current = m;
    }

    const step = () => {
      try {
        const frac = fraction();
        const pt = (pointAlongRoute as any)(routeCoords, frac);
        if (pt && markerRef.current) {
          markerRef.current.setLatLng([pt.lat, pt.lng]);
        }
      } catch (e) {}
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try { if (markerRef.current) map.removeLayer(markerRef.current); } catch (e) {}
      try { if (polyRef.current) map.removeLayer(polyRef.current); } catch (e) {}
      markerRef.current = null;
    };
  }, [map, routeCoords, trip]);

  return null;
};
