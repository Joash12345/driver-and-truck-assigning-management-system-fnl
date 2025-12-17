import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { useTruckContext } from "@/context/TruckContext";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Pos = { lat: number; lng: number };

const DEFAULT_CENTER: Pos = { lat: 14.5995, lng: 120.9842 }; // Manila as default center

const createDeviceIcon = (label?: string, color = "#ef4444") => {
  const safeLabel = String(label || "me").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
    <svg xmlns='http://www.w3.org/2000/svg' width='28' height='36' viewBox='0 0 24 36'>
      <path d='M12 0C7 0 3 4 3 9c0 7.5 9 21 9 21s9-13.5 9-21c0-5-4-9-9-9z' fill='${color}'/>
      <circle cx='12' cy='9' r='3' fill='white'/>
    </svg>`;
  // stable pseudo-random based on label so each marker has unique bounce timing
  const stableRandom = (s: string) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return (h >>> 0) / 4294967295;
  };

  const seed = stableRandom(safeLabel || String(Date.now()));
  const duration = (1.0 + seed * 1.4).toFixed(2); // 1.0 - 2.4s
  const delay = (seed * 0.9).toFixed(2); // 0 - 0.9s

  return L.divIcon({
    className: "device-pin",
    html: `<div class="device-pin-bounce" style="display:flex;flex-direction:column;align-items:center;animation-duration:${duration}s;animation-delay:${delay}s"><div style=\"line-height:0\">${svg}</div><div style=\"font-size:10px;color:${color};margin-top:2px;white-space:nowrap\">${safeLabel}</div></div>`,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  });
};

const ClientMarkerLayer: React.FC<{ clients: Record<string, Pos>; meta?: Record<string, { name?: string; color?: string }> }> = ({ clients, meta = {} }) => {
  const map = useMap();
  const markersRef = useRef<Record<string, L.Marker>>({});
  const animRef = useRef<Record<string, { raf?: number; start?: number }>>({});

  useEffect(() => {
    if (!map) return;

    // helper: apply zoom-based scaling to marker DOM
    const baseZoom = map.getZoom() || 12;
    const applyScaleToAll = () => {
      try {
        const z = map.getZoom();
        const scale = Math.pow(1.15, (z || baseZoom) - baseZoom); // exponential scale per zoom level
        Object.values(markersRef.current).forEach((marker) => {
          try {
            const el = marker.getElement() as HTMLElement | null;
            if (!el) return;
            const inner = el.querySelector('.device-pin-bounce') as HTMLElement | null;
            if (inner) {
              inner.style.transform = `scale(${scale})`;
              inner.style.transformOrigin = 'center bottom';
            }
          } catch (e) {}
        });
      } catch (e) {}
    };

    // apply scaling on zoom changes
    const onZoom = () => applyScaleToAll();
    map.on('zoomend', onZoom);

    // Add new markers and animate existing ones
    Object.entries(clients).forEach(([id, p]) => {
      const label = (meta && meta[id] && meta[id].name) || id;
      const color = (meta && meta[id] && meta[id].color) || "#ef4444";
      const target = L.latLng(p.lat, p.lng);

      let marker = markersRef.current[id];
      if (!marker) {
        marker = L.marker([p.lat, p.lng], { icon: createDeviceIcon(label, color) }).bindPopup(`${label}`);
        marker.addTo(map);
        // clicking a marker flies/zooms the map to that marker
        try {
          marker.on('click', () => {
            try {
              const latlng = marker!.getLatLng();
              const targetZoom = Math.max((map.getZoom() || 12) + 3, 16);
              map.flyTo(latlng, targetZoom, { duration: 0.6 });
            } catch (e) {}
          });
        } catch (e) {}
        markersRef.current[id] = marker;
        // apply current zoom scale to new marker element and make it clickable
        try {
          const z = map.getZoom() || baseZoom;
          const scale = Math.pow(1.15, z - baseZoom);
          const el = marker.getElement() as HTMLElement | null;
          if (el) {
            const inner = el.querySelector('.device-pin-bounce') as HTMLElement | null;
            if (inner) {
              inner.style.transform = `scale(${scale})`;
              inner.style.transformOrigin = 'center bottom';
            }
            try { el.style.cursor = 'pointer'; } catch (e) {}
          }
        } catch (e) {}
        return;
      }

      // cancel previous animation
      if (animRef.current[id] && animRef.current[id].raf) {
        cancelAnimationFrame(animRef.current[id].raf!);
      }

      const from = marker.getLatLng();
      const duration = 5000; // ms - slow smooth movement
      const start = performance.now();
      animRef.current[id] = { start };

      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const lat = from.lat + (target.lat - from.lat) * t;
        const lng = from.lng + (target.lng - from.lng) * t;
        marker!.setLatLng([lat, lng]);
        if (t < 1) {
          animRef.current[id].raf = requestAnimationFrame(step);
        } else {
          delete animRef.current[id];
        }
      };

      animRef.current[id].raf = requestAnimationFrame(step);
    });

    // remove markers not present anymore
    Object.keys(markersRef.current).forEach((id) => {
      if (!(id in clients)) {
        try { map.removeLayer(markersRef.current[id]); } catch (e) {}
        delete markersRef.current[id];
        if (animRef.current[id] && animRef.current[id].raf) cancelAnimationFrame(animRef.current[id].raf!);
        delete animRef.current[id];
      }
    });

    // initial apply
    applyScaleToAll();

    return () => {
      try { map.off('zoomend', onZoom); } catch (e) {}
      Object.values(markersRef.current).forEach((m) => { try { map.removeLayer(m); } catch (e) {} });
      Object.values(animRef.current).forEach((a) => { if (a.raf) cancelAnimationFrame(a.raf); });
      markersRef.current = {};
      animRef.current = {};
    };
  }, [clients, meta, map]);

  return null;
};

// Enable zoom only when Ctrl (or Meta on macOS) is pressed while using the mouse wheel
const ControlZoomWithCtrl: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const container = map.getContainer();
    const handler = (e: WheelEvent) => {
      // require Ctrl or Meta key
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const current = map.getZoom();
      const min = (map.getMinZoom && map.getMinZoom()) || 0;
      const max = (map.getMaxZoom && map.getMaxZoom()) || 22;
      const delta = e.deltaY > 0 ? -1 : 1;
      const next = Math.max(min, Math.min(max, current + delta));
      map.setZoom(next);
    };

    container.addEventListener('wheel', handler, { passive: false });
    return () => container.removeEventListener('wheel', handler);
  }, [map]);

  return null;
};

const TrackingMap: React.FC = () => {
  const { trucks } = useTruckContext();
  const [positions, setPositions] = useState<Record<string, Pos>>({});
  const [clientPositions, setClientPositions] = useState<Record<string, Pos>>({});
  const [clientMeta, setClientMeta] = useState<Record<string, { name?: string; color?: string }>>({});
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regName, setRegName] = useState('');
  const [regColor, setRegColor] = useState('');
  const [regCode, setRegCode] = useState(() => String(Math.floor(100000 + Math.random() * 900000)));
  const wsRef = useRef<WebSocket | null>(null);
  const [wsStatus, setWsStatus] = useState<string>("disconnected");
  const [lastReceived, setLastReceived] = useState<string>("");
  const [lastSent, setLastSent] = useState<string>("");
  const watchIdRef = useRef<number | null>(null);
  const clientIdRef = useRef<string | null>(null);
  const [active, setActive] = useState<'none' | 'sending' | 'stopped'>('none');

  // Initialize a session-scoped client id (do not persist in localStorage)
  useEffect(() => {
    if (!clientIdRef.current) {
      clientIdRef.current = `c-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
  }, []);

  // When name/color change, update local client meta and notify server via WS
  useEffect(() => {
    const cid = clientIdRef.current;
    if (!cid) return;
    setClientMeta((prev) => ({ ...prev, [cid]: { name: regName || undefined, color: regColor || undefined } }));
    try {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        const payload: any = { type: 'client-register', clientId: cid, name: regName || undefined, color: regColor || undefined };
        ws.send(JSON.stringify(payload));
        setLastSent(JSON.stringify(payload));
      }
    } catch (e) {}
  }, [regName, regColor]);

  const sendTestPosition = () => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      // quick feedback
      // eslint-disable-next-line no-alert
      alert('WebSocket not open');
      return;
    }

    const generateRandomColor = () => {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) color += letters[Math.floor(Math.random() * 16)];
      return color;
    };

    const send = (lat: number, lng: number) => {
      const cid = clientIdRef.current || `c-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      clientIdRef.current = cid;

      // determine a stable color to use: prefer stored profile color, then regColor state, else generate when name provided
      let colorToUse = '';
      if (!colorToUse && regColor) colorToUse = regColor;
      if (!colorToUse && regName) {
        colorToUse = generateRandomColor();
        setRegColor(colorToUse);
      }
      if (regName) {
        setClientMeta((prev) => ({ ...prev, [cid]: { name: regName, color: colorToUse } }));
      }

      const out: any = { type: 'client-position', clientId: cid, lat, lng };
      if (regName) out.name = regName;
      if (colorToUse) out.color = colorToUse;
      console.debug('[TrackingMap] send test', out);
      setLastSent(JSON.stringify(out));
      ws.send(JSON.stringify(out));
      setClientPositions((prev) => ({ ...prev, [cid]: { lat, lng } }));
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (p) => send(p.coords.latitude, p.coords.longitude),
        () => send(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      send(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);
    }
  };

  const stopSending = () => {
    if (watchIdRef.current != null && 'geolocation' in navigator) {
      try { navigator.geolocation.clearWatch(watchIdRef.current); } catch (e) {}
      watchIdRef.current = null;
    }

    const cid = clientIdRef.current;
    if (cid) {
      // remove this client's marker from the map
      setClientPositions((prev) => {
        const next = { ...prev };
        if (cid in next) delete next[cid];
        return next;
      });

      // optionally notify server that this client stopped
      try {
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
          const out = { type: 'client-stop', clientId: cid } as any;
          ws.send(JSON.stringify(out));
          setLastSent(JSON.stringify(out));
        }
      } catch (e) {}
    }

    setActive('stopped');
  };

  // Load or initialize truck positions (kept for persistence but not rendered)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("truck_locations");
      const parsed = raw ? (JSON.parse(raw) as Record<string, Pos>) : null;
      if (parsed) {
        setPositions(parsed);
        return;
      }
    } catch (e) {
      // ignore
    }

    const initial: Record<string, Pos> = {};
    const spread = 0.3; // degrees
    const now = Date.now();
    (trucks || []).forEach((t, i) => {
      const rnd = (seed: number) => (Math.sin(seed + i) * 0.5 + 0.5);
      initial[t.id] = {
        lat: DEFAULT_CENTER.lat + (rnd(now + i) - 0.5) * spread,
        lng: DEFAULT_CENTER.lng + (rnd(now + i * 7) - 0.5) * spread,
      };
    });
    setPositions(initial);
    try { localStorage.setItem("truck_locations", JSON.stringify(initial)); } catch (e) {}
  }, [trucks]);

  // Periodically jitter truck positions and persist (does not move the map)
  useEffect(() => {
    const id = setInterval(() => {
      setPositions((prev) => {
        const next = { ...prev };
        (trucks || []).forEach((t) => {
          const p = next[t.id];
          if (!p) return;
          if (t.status === "intransit") {
            const jitter = 0.0015;
            next[t.id] = {
              lat: p.lat + (Math.random() - 0.5) * jitter,
              lng: p.lng + (Math.random() - 0.5) * jitter,
            };
          }
        });
        try { localStorage.setItem("truck_locations", JSON.stringify(next)); } catch (e) {}
        return next;
      });
    }, 5000);

    return () => clearInterval(id);
  }, [trucks]);

  // WebSocket client to receive client-position and position-update messages
  useEffect(() => {
    const URL = (import.meta.env.VITE_WS_URL as string) || "ws://localhost:8082";
    let ws: WebSocket | null = null;
    let reconnectTimer: any = null;

    const connect = () => {
      // guard: don't open a second socket if one already exists
      if (wsRef.current) return;
      try {
        ws = new WebSocket(URL);
        wsRef.current = ws;
      } catch (e) {
        ws = null;
      }

      if (!ws) return;

      ws.onopen = () => {
        console.debug("[TrackingMap] WS connected to", URL);
        setWsStatus("open");
        try {
          const cid = clientIdRef.current || `c-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          clientIdRef.current = cid;
          if (regName) {
            const payload = { type: 'client-register', clientId: cid, name: regName, color: regColor };
            console.debug('[TrackingMap] send', payload);
            setLastSent(JSON.stringify(payload));
            ws && ws.send(JSON.stringify(payload));
            setClientMeta((prev) => ({ ...prev, [cid]: { name: regName, color: regColor } }));
          } else {
            const hello = { type: 'client-hello', clientId: cid };
            console.debug('[TrackingMap] send', hello);
            setLastSent(JSON.stringify(hello));
            ws && ws.send(JSON.stringify(hello));
          }
        } catch (e) {}
      };

      ws.onmessage = (ev) => {
        console.debug('[TrackingMap] WS message', ev.data);
        setLastReceived(String(ev.data));
        try {
          const msg = JSON.parse(ev.data);
          if (!msg || !msg.type) return;
          if (msg.type === 'client-position' && msg.clientId && msg.lat && msg.lng) {
            setClientPositions((prev) => ({ ...prev, [msg.clientId]: { lat: msg.lat, lng: msg.lng } }));
          }
          if (msg.type === 'client-register' && msg.clientId) {
            setClientMeta((prev) => ({ ...prev, [msg.clientId]: { name: msg.name, color: msg.color } }));
          }
          if (msg.type === 'client-stop' && msg.clientId) {
            // remove stopped client from positions and meta so markers disappear
            setClientPositions((prev) => {
              const next = { ...prev };
              if (msg.clientId in next) delete next[msg.clientId];
              return next;
            });
            setClientMeta((prev) => {
              const next = { ...prev };
              if (msg.clientId in next) delete next[msg.clientId];
              return next;
            });
            return;
          }
          if (msg.type === 'position-update' && msg.id && msg.lat && msg.lng) {
            setPositions((prev) => ({ ...prev, [msg.id]: { lat: msg.lat, lng: msg.lng } }));
          }
        } catch (e) { console.debug('[TrackingMap] WS message parse error', e); }
      };

      ws.onclose = () => {
        console.debug('[TrackingMap] WS closed');
        setWsStatus('closed');
        wsRef.current = null;
        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(connect, 2000);
      };
      ws.onerror = (ev) => {
        console.debug('[TrackingMap] WS error', ev);
        setWsStatus('error');
        // let onclose handle reconnect
      };
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) try { wsRef.current.close(); } catch (e) {}
    };
  }, []);

  // Geolocation watch (send our phone/device position to WS)
  // Start watching only when `active` === 'sending'. Stop when `active` changes or component unmounts.
  useEffect(() => {
    if (!('geolocation' in navigator)) return;

    // If not actively sending, ensure any existing watch is cleared and return
    if (active !== 'sending') {
      if (watchIdRef.current != null) {
        try { navigator.geolocation.clearWatch(watchIdRef.current); } catch (e) {}
        watchIdRef.current = null;
      }
      return;
    }

    const success = (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const cid = clientIdRef.current || `c-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      clientIdRef.current = cid;
      setClientPositions((prev) => ({ ...prev, [cid]: { lat, lng } }));
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        const out: any = { type: 'client-position', clientId: cid, lat, lng };
        if (regName) out.name = regName;
        if (regColor) out.color = regColor;
        try {
          setLastSent(JSON.stringify(out));
          ws.send(JSON.stringify(out));
        } catch (e) {}
      }
    };

    const error = (err: any) => {
      console.warn('geolocation error', err);
    };

    try {
      const id = navigator.geolocation.watchPosition(success, error, { enableHighAccuracy: true, maximumAge: 5000, timeout: 5000 });
      watchIdRef.current = id as unknown as number;
    } catch (e) {
      console.warn('geolocation.watchPosition failed', e);
    }

    return () => {
      if (watchIdRef.current != null) {
        try { navigator.geolocation.clearWatch(watchIdRef.current); } catch (e) {}
        watchIdRef.current = null;
      }
    };
  }, [active]);

  // Render static map with device markers only (map does not auto-center)
  return (
    <div className="relative">
      <MapContainer center={[DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]} zoom={12} style={{ height: "520px", width: "100%" }} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ControlZoomWithCtrl />
      <ClientMarkerLayer clients={clientPositions} meta={clientMeta} />
      </MapContainer>

      <div className="pointer-events-auto absolute top-2 right-2 z-[9999] w-56 p-2 bg-white/90 dark:bg-black/80 rounded text-xs text-foreground shadow">
        <div className="mb-2 text-sm">id: <span className="font-mono">{clientIdRef.current ?? '—'}</span></div>
        <div className="mb-2">
          <Label className="text-xs">name:</Label>
          <Input value={regName} onChange={(e) => setRegName((e.target as HTMLInputElement).value)} placeholder="Your name" />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant={active === 'stopped' ? undefined : 'outline'}
            className={active === 'stopped' ? 'text-white bg-red-600 hover:bg-red-700' : ''}
            onClick={() => { stopSending(); }}
          >
            Stop
          </Button>
          <Button
            size="sm"
            variant={active === 'sending' ? undefined : 'outline'}
            className={active === 'sending' ? 'text-white bg-green-600 hover:bg-green-700' : ''}
            onClick={() => { setActive('sending'); sendTestPosition(); }}
          >
            Send test pos
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TrackingMap;
