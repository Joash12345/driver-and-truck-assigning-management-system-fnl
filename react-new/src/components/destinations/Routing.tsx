import { useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet-routing-machine';

interface LatLng {
  lat: number;
  lng: number;
}

interface RoutingProps {
  origin: LatLng;
  destination: LatLng;
  setRouteInfo?: (info: { distance: string; duration: string; fuelLiters: string }) => void;
  setRouteCoords?: (coords: Array<[number, number]>) => void;
  lineColor?: string;
}

const Routing = ({ origin, destination, setRouteInfo, setRouteCoords, lineColor = 'blue' }: RoutingProps) => {
  const map = useMap();

  useEffect(() => {
    if (!origin || !destination || !map) return;

    const truckEmojiIcon = new L.DivIcon({
      html: '🚚',
      className: 'truck-emoji-marker',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    let highlightMarker: L.Marker | null = null;

    try {
      // optional itinerary override (best-effort)
      if ((L as any).Routing && (L as any).Routing.Itinerary) {
        (L as any).Routing.Itinerary.prototype._updateRoutes = function (routes: any) {
          if (!routes.length) return;
          const itinerary = this;

          this._clearHighlights?.();
          this._routes = routes;

          routes[0].instructions.forEach((instruction: any, i: number) => {
            if (instruction.index >= 0) {
              const stepLatLng = routes[0].coordinates[instruction.index];

              if (!highlightMarker) {
                highlightMarker = L.marker(stepLatLng, { icon: truckEmojiIcon }).addTo(map);
              }

              this._highlights = this._highlights || [];
              this._highlights.push(L.circleMarker(stepLatLng, { radius: 0 }).addTo(map));

              const alt = this._container?.querySelectorAll('.leaflet-routing-alt')?.[0];
              if (alt) {
                alt.addEventListener('mouseover', function () {
                  highlightMarker?.setLatLng(stepLatLng);
                });
              }
            }
          });
        };
      }
    } catch (e) {
      // ignore
    }

    // Try a direct routing fetch first (faster control over errors). Fall back to a straight line if routing backend is unreachable.
    let poly: L.Polyline | null = null;
    const routerUrl = (import.meta.env.VITE_ROUTER_URL as string) || 'https://router.project-osrm.org';
    const ctrl = new AbortController();

    (async () => {
      try {
        const url = `${routerUrl}/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
        const timeout = setTimeout(() => ctrl.abort(), 7000);
        const res = await fetch(url, { signal: ctrl.signal });
        clearTimeout(timeout);
        if (!res.ok) throw new Error('OSRM fetch failed');
        const data = await res.json();
        const coords: any[] = data?.routes?.[0]?.geometry?.coordinates;
        if (Array.isArray(coords) && coords.length) {
          const latlngs = coords.map((c: any) => [c[1], c[0]] as [number, number]);
          poly = L.polyline(latlngs, { color: lineColor, weight: 4, opacity: 0.95 }).addTo(map);
          try { console.debug('[Routing] fetched route coords length=', coords.length); } catch (e) {}
          // set route info if available
          try {
            const summary = data.routes?.[0]?.summary;
            if (summary) {
              const distanceKm = summary.distance ? summary.distance / 1000 : 0;
              const fuelLiters = distanceKm / 3.5;
              setRouteInfo?.({ distance: distanceKm.toFixed(2) + ' km', duration: Math.ceil((summary.duration || 0) / 60) + ' mins', fuelLiters: fuelLiters.toFixed(2) + ' L' });
            }
          } catch (e) {}
          try {
            const coordsNormalized = coords.map((c: any) => [c[0], c[1]] as [number, number]);
            if (coordsNormalized.length && setRouteCoords) {
              try { console.debug('[Routing] setRouteCoords via fetch, len=', coordsNormalized.length); } catch (e) {}
              setRouteCoords(coordsNormalized);
            }
          } catch (e) {}
        }
      } catch (e) {
        // fetch failed or timed out
      }
    })();

    // fallback: after short delay, draw straight line and set coords so marker can still animate
    const fallbackTimer = window.setTimeout(() => {
        if (poly) return; // already have a route
      try {
        poly = L.polyline([[origin.lat, origin.lng], [destination.lat, destination.lng]], { color: lineColor, weight: 2, opacity: 0.6 }).addTo(map);
        try {
          if (setRouteCoords) {
            try { console.debug('[Routing] fallback setRouteCoords straight line'); } catch (e) {}
            setRouteCoords([[origin.lng, origin.lat], [destination.lng, destination.lat]]);
          }
        } catch (e) {}
      } catch (e) {}

      // still try to attach control if available (may succeed later)
      if ((L as any).Routing && typeof (L as any).Routing.control === 'function') {
        try {
          const control = (L as any).Routing.control({
            waypoints: [L.latLng(origin.lat, origin.lng), L.latLng(destination.lat, destination.lng)],
            lineOptions: { styles: [{ color: lineColor, weight: 4 }] },
            show: true,
            position: 'topright',
            routeWhileDragging: false,
            draggableWaypoints: false,
            addWaypoints: false,
          }).addTo(map);

          const onRoutesFound = (e: any) => {
            try {
              const route = e.routes[0];
              if (!route) return;
              try {
                const coords = (route.coordinates || []).map((c: any) => [c[0], c[1]] as [number, number]);
                if (coords.length && setRouteCoords) {
                  try { console.debug('[Routing] control routesfound coords len=', coords.length); } catch (e) {}
                  setRouteCoords(coords);
                }
              } catch (e) {}
            } catch (err) {}
          };
          control.on('routesfound', onRoutesFound);
        } catch (e) {}
      }
    }, 1200);

    return () => {
      clearTimeout(fallbackTimer);
      try { ctrl.abort(); } catch (e) {}
      try { if (poly) map.removeLayer(poly); } catch (e) {}
    };

    const control = (L as any).Routing.control({
      waypoints: [
        L.latLng(origin.lat, origin.lng),
        L.latLng(destination.lat, destination.lng),
      ],
      lineOptions: { styles: [{ color: lineColor, weight: 4 }] },
      show: true,
      position: 'topright',
      routeWhileDragging: false,
      draggableWaypoints: false,
      addWaypoints: false,
      createMarker: (i: number, wp: any, n: number) => {
        if (i === n - 1) {
          return L.marker(wp.latLng, { icon: truckEmojiIcon });
        }
        return L.marker(wp.latLng);
      },
    }).addTo(map);

    const onRoutesFound = (e: any) => {
      try {
        const route = e.routes[0];
        if (!route) return;
        const distanceKm = route.summary?.totalDistance ? route.summary.totalDistance / 1000 : 0;
        const fuelLiters = distanceKm / 3.5;
        setRouteInfo?.({
          distance: distanceKm.toFixed(2) + ' km',
          duration: Math.ceil((route.summary?.totalTime || 0) / 60) + ' mins',
          fuelLiters: fuelLiters.toFixed(2) + ' L',
        });
        try {
          const coords = (route.coordinates || []).map((c: any) => [c[0], c[1]] as [number, number]);
          if (coords.length && setRouteCoords) setRouteCoords(coords);
        } catch (e) {}
      } catch (err) {}
    };

    control.on('routesfound', onRoutesFound);

    return () => {
      try { control.off('routesfound', onRoutesFound); } catch (e) {}
      try { map.removeControl(control); } catch (e) {}
    };
  }, [origin, destination, map, setRouteInfo, lineColor]);

  return null;
};

export default Routing;
