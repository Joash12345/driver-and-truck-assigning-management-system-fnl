import React, { useState, useEffect } from "react";
import DestinationMap from "@/components/destinations/DestinationMap";
import { useRef } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTruckContext } from "@/context/TruckContext";
import { getStatusBadge } from "@/components/drivers/utils/driverStatusUtils";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
// no action icons needed; table will show trip status
export type DestinationType = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  truckId?: string;
  type: "warehouse" | "retail" | "distribution" | "manufacturing";
  tripsPerWeek: number;
  travelTime: string;
  availableTrucks: number;
  lat?: number;
  lng?: number;
  shipmentDate?: string;
  cargoType?: string;
  notes?: string;
};

const mockDestinations: DestinationType[] = [];

const Destinations: React.FC = () => {
  const [destinations, setDestinations] = useState<DestinationType[]>([]);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewingDestination, setViewingDestination] = useState<DestinationType | null>(null);
  const [viewingTrip, setViewingTrip] = useState<any | null>(null);
  const [focusPosition, setFocusPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [focusLabel, setFocusLabel] = useState<string | null>(null);
  const { toast } = useToast();
  const { trucks, addTruck } = useTruckContext();
  const [tripStatusFilter, setTripStatusFilter] = useState<string>("all");
  const wsUrl = (import.meta.env.VITE_WS_URL as string) || "ws://localhost:8082";

  // Dev tools: logger and cluster rebuild toggle (DEV only)
  const [devShowLogger, setDevShowLogger] = useState(false);
  const [devForceRebuild, setDevForceRebuild] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const wsLogRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    // connect to wsUrl for logging only
    try {
      const ws = new WebSocket(wsUrl);
      wsLogRef.current = ws;
      ws.onmessage = (ev) => {
        try {
          setLogs((prev) => [
            `${new Date().toLocaleTimeString()} WS: ${String(ev.data)}`,
            ...prev,
          ].slice(0, 200));
        } catch (e) {}
      };
      ws.onopen = () => setLogs((prev) => [`${new Date().toLocaleTimeString()} WS: open`, ...prev].slice(0,200));
      ws.onclose = () => setLogs((prev) => [`${new Date().toLocaleTimeString()} WS: closed`, ...prev].slice(0,200));
      ws.onerror = (ev) => setLogs((prev) => [`${new Date().toLocaleTimeString()} WS: error`, ...prev].slice(0,200));
      return () => { try { ws.close(); } catch (e) {} wsLogRef.current = null; };
    } catch (e) {}
  }, [wsUrl]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const onStorage = (ev: StorageEvent) => {
      try {
        setLogs((prev) => [`${new Date().toLocaleTimeString()} STORAGE: ${ev.key}=${String(ev.newValue)}` , ...prev].slice(0,200));
      } catch (e) {}
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("destinations", JSON.stringify(destinations));
    } catch (e) {}
  }, [destinations]);

  // Ensure the page starts fresh: clear any previously persisted destinations
  useEffect(() => {
    try {
      const raw = localStorage.getItem('destinations');
      if (raw) setDestinations(JSON.parse(raw) as DestinationType[]);
    } catch (e) {}
  }, []);

  const [addForm, setAddForm] = useState<Partial<DestinationType>>({
    name: '',
    address: '',
    city: '',
    state: '',
    truckId: '',
    type: 'warehouse',
    shipmentDate: '',
    cargoType: '',
    notes: '',
  });

  const handleAdd = (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    const id = `D-${Date.now()}`;
    const newDest: DestinationType = {
      id,
      name: String(addForm.name || ''),
      address: String(addForm.address || ''),
      city: String(addForm.city || ''),
      state: String(addForm.state || ''),
      truckId: addForm.truckId,
      type: (addForm.type as DestinationType['type']) || 'warehouse',
      shipmentDate: addForm.shipmentDate,
      cargoType: addForm.cargoType,
      notes: addForm.notes,
      tripsPerWeek: 0,
      travelTime: '',
      availableTrucks: 0,
      lat: addForm.lat,
      lng: addForm.lng,
    };
    setDestinations((p) => [newDest, ...p]);
    setIsAddOpen(false);
    setAddForm({ name: '', address: '', city: '', state: '', truckId: '', type: 'warehouse', shipmentDate: '', cargoType: '', notes: '' });
    toast({ title: 'Destination added' });
  };
  
  // Edit flow
  const [editingId, setEditingId] = useState<string | null>(null);
  const openEdit = (dest: DestinationType) => {
    setEditingId(dest.id);
    setAddForm({ ...dest });
    setIsAddOpen(true);
  };

  const handleSave = (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (editingId) {
      setDestinations((prev) => prev.map(d => d.id === editingId ? { ...d, ...addForm, id: editingId } as DestinationType : d));
      setEditingId(null);
      setIsAddOpen(false);
      setAddForm({ name: '', address: '', city: '', state: '', truckId: '', type: 'warehouse', shipmentDate: '', cargoType: '', notes: '' });
      toast({ title: 'Destination updated' });
      return;
    }
    handleAdd();
  };

  const handleDelete = (id: string) => {
    if (!confirm('Remove destination?')) return;
    setDestinations(prev => prev.filter(d => d.id !== id));
    toast({ title: 'Destination removed' });
  };
  const filtered = (() => {
    if (!search) return destinations;
    const q = search.toLowerCase();

    // Trips that match a truck name or driver name — use in-memory tripsFromStorage
    const matchingTripDestinations = new Set<string>();
    try {
      tripsFromStorage.forEach((t) => {
        const truck = trucks.find((tx: any) => String(tx.id) === String(t.truckId));
        const truckMatches = truck && truck.name && String(truck.name).toLowerCase().includes(q);
        const driverMatches = (t.driverName && String(t.driverName).toLowerCase().includes(q)) || (t.driver && String(t.driver).toLowerCase().includes(q));
        if (truckMatches || driverMatches) {
          if (t.destination) matchingTripDestinations.add(String(t.destination));
          if (t.destinationAddress) matchingTripDestinations.add(String(t.destinationAddress));
        }
      });
    } catch (e) {}

    return destinations.filter((d) => {
      const fields = [d.name, d.address, d.city, d.state, d.type].join(' ').toLowerCase();
      if (fields.includes(q)) return true;
      if (d.truckId && String(d.truckId).toLowerCase().includes(q)) return true;
      if (matchingTripDestinations.has(String(d.address)) || matchingTripDestinations.has(String(d.name))) return true;
      return false;
    });
  })();
  // Read trips from localStorage to associate with destinations
  const tripsFromStorage: any[] = (() => {
    try {
      const raw = localStorage.getItem('trips');
      if (!raw) return [];
      const parsed = JSON.parse(raw) as any[];
      return parsed.map((t) => ({ ...t, startTime: t.startTime ? new Date(t.startTime) : undefined, endTime: t.endTime ? new Date(t.endTime) : undefined }));
    } catch (e) {
      return [];
    }
  })();

  return (
    <div className="content-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div>
            <Select value={tripStatusFilter} onValueChange={setTripStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Trips" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="intransit">In Transit</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="ml-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => {
              // seed demo data
              const demoTrucks = [
                {
                  id: 'T-DEMO1',
                  name: 'Demo Truck 1',
                  plateNumber: 'DEM-0001',
                  model: 'DemoModel',
                  driver: 'Demo Driver',
                  fuelLevel: 80,
                  status: 'intransit',
                  lastMaintenance: new Date().toISOString().slice(0,10),
                }
              ];

              const demoDests = [
                {
                  id: 'D-DEMO1',
                  name: 'Demo Origin',
                  address: 'Origin Address',
                  city: 'City A',
                  state: 'State A',
                  type: 'warehouse',
                  tripsPerWeek: 0,
                  travelTime: '',
                  availableTrucks: 1,
                  lat: 8.4542,
                  lng: 124.6319,
                },
                {
                  id: 'D-DEMO2',
                  name: 'Demo Destination',
                  address: 'Destination Address',
                  city: 'City B',
                  state: 'State B',
                  type: 'retail',
                  tripsPerWeek: 0,
                  travelTime: '',
                  availableTrucks: 0,
                  lat: 7.1907,
                  lng: 125.4553,
                }
              ];

              const now = Date.now();
              const demoTrips = [
                {
                  id: 'TRIP-DEMO1',
                  truckId: 'T-DEMO1',
                  driverId: 'D-000',
                  driverName: 'Demo Driver',
                  origin: demoDests[0].address,
                  destination: demoDests[1].address,
                  originLat: demoDests[0].lat,
                  originLng: demoDests[0].lng,
                  destLat: demoDests[1].lat,
                  destLng: demoDests[1].lng,
                  startTime: new Date(now - 5 * 60 * 1000).toISOString(),
                  endTime: new Date(now + 55 * 60 * 1000).toISOString(),
                  travelTimeSeconds: 60 * 60,
                  eta: new Date(now + 55 * 60 * 1000).toISOString(),
                  cargo: 'Demo cargo',
                  notes: 'Demo trip',
                  status: 'intransit',
                }
              ];

              try {
                // persist demo trucks (avoid duplicates)
                const rawT = localStorage.getItem('trucks');
                const existingT = rawT ? JSON.parse(rawT) : [];
                const mergedT = [...demoTrucks.filter(dt => !existingT.some((et: any) => et.id === dt.id)), ...existingT];
                localStorage.setItem('trucks', JSON.stringify(mergedT));
                // also add to context
                demoTrucks.forEach(dt => {
                  if (!trucks.some((t: any) => t.id === dt.id)) addTruck(dt as any);
                });

                // persist destinations
                const rawD = localStorage.getItem('destinations');
                const existingD = rawD ? JSON.parse(rawD) : [];
                const mergedD = [...demoDests.filter(dd => !existingD.some((ed: any) => ed.id === dd.id)), ...existingD];
                localStorage.setItem('destinations', JSON.stringify(mergedD));
                setDestinations(mergedD);

                // persist trips
                const rawTrips = localStorage.getItem('trips');
                const existingTrips = rawTrips ? JSON.parse(rawTrips) : [];
                const mergedTrips = [...demoTrips.filter(dt => !existingTrips.some((et: any) => et.id === dt.id)), ...existingTrips];
                localStorage.setItem('trips', JSON.stringify(mergedTrips));

                toast({ title: 'Demo seeded', description: 'Demo trucks, destinations and a trip were added.' });
              } catch (e) {
                console.error(e);
                toast({ title: 'Demo failed', description: 'Could not seed demo data.' });
              }
            }}>Seed Demo</Button>
          </div>
        </div>
      </div>

      <DestinationMap destinations={filtered} wsUrl={wsUrl} focusPosition={focusPosition} focusLabel={focusLabel} focusedTrip={viewingTrip} devForceRebuild={devForceRebuild} />

      {import.meta.env.DEV && (
        <div className="mt-4">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={devShowLogger} onChange={(e) => setDevShowLogger(e.target.checked)} />
              <span className="text-sm">Show WS / storage logger</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={devForceRebuild} onChange={(e) => setDevForceRebuild(e.target.checked)} />
              <span className="text-sm">Force cluster rebuild (dev)</span>
            </label>
            <Button variant="outline" onClick={() => setLogs([])}>Clear Logs</Button>
          </div>

          {devShowLogger && (
            <div className="mt-2 p-3 bg-slate-900 text-slate-50 rounded-md max-h-48 overflow-auto text-xs">
              {logs.length === 0 ? (
                <div className="text-slate-300">No logs yet</div>
              ) : (
                logs.map((l, i) => <div key={i} className="py-0.5 border-b border-slate-700 last:border-b-0">{l}</div>)
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">Destinations</h2>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                    <TableHead>Trip ID</TableHead>
                    <TableHead>Truck</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Departure</TableHead>
                    <TableHead>Arrival</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
            </TableHeader>
            <TableBody>
              {/* Filter trips according to selected tripStatusFilter */}
              {(() => {
                const now = Date.now();
                const matchesFilter = (trip: any) => {
                  if (!tripStatusFilter || tripStatusFilter === 'all') return true;
                  if (tripStatusFilter === 'pending') return trip.status === 'pending';
                  if (tripStatusFilter === 'intransit') return trip.status === 'intransit';
                  if (tripStatusFilter === 'completed') return trip.status === 'completed';
                  return true;
                };

                const tripsFiltered = (tripsFromStorage || []).filter(matchesFilter);

                if (tripsFiltered.length > 0) {
                  return [...tripsFiltered]
                    .sort((a, b) => {
                      const ta = a.startTime ? new Date(a.startTime).getTime() : 0;
                      const tb = b.startTime ? new Date(b.startTime).getTime() : 0;
                      return ta - tb;
                    })
                    .map((trip) => (
                      <TableRow key={trip.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center h-12">
                            <span className="text-sm text-muted-foreground">{trip.id}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center h-12">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{trucks.find((t) => String(t.id) === String(trip.truckId))?.name || trip.truckId || '—'}</div>
                              <div className="text-xs text-muted-foreground">{trucks.find((t) => String(t.id) === String(trip.truckId))?.id || trip.truckId || '—'}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center h-12">
                            <div className="flex-1 min-w-0">
                              <div className="truncate">{trip.driverName || trip.driver || '—'}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{trip.startTime ? format(new Date(trip.startTime), 'yyyy-MM-dd h:mm a') : '—'}</TableCell>
                        <TableCell>{trip.status === 'intransit' ? '—' : (trip.endTime ? format(new Date(trip.endTime), 'yyyy-MM-dd h:mm a') : '—')}</TableCell>
                        <TableCell>{trip.status ? getStatusBadge(trip.status) : '—'}</TableCell>
                        <TableCell className="text-right">
                              <Button size="sm" variant="default" onClick={(e) => {
                                e.stopPropagation();
                                setViewingTrip(trip); setViewingDestination(null);
                                // compute focus if intransit and coords available
                                try {
                                  if (trip && trip.status === 'intransit') {
                                    const oLat = trip.originLat ?? trip.origin?.lat;
                                    const oLng = trip.originLng ?? trip.origin?.lng;
                                    const dLat = trip.destLat ?? trip.destination?.lat;
                                    const dLng = trip.destLng ?? trip.destination?.lng;
                                    if (typeof oLat === 'number' && typeof oLng === 'number' && typeof dLat === 'number' && typeof dLng === 'number') {
                                      const start = trip.startTime ? new Date(trip.startTime).getTime() : Date.now();
                                      const end = trip.endTime ? new Date(trip.endTime).getTime() : (start + 60 * 60 * 1000);
                                      const frac = Math.max(0, Math.min(1, (Date.now() - start) / Math.max(1, end - start)));
                                      setFocusPosition({ lat: oLat + (dLat - oLat) * frac, lng: oLng + (dLng - oLng) * frac });
                                      setFocusLabel(String(trip.truckId || trip.id || ''));
                                    } else setFocusPosition(null);
                                  } else setFocusPosition(null);
                                } catch (e) { setFocusPosition(null); }
                                setIsViewOpen(true);
                              }}>
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ));
                }

                if (filtered.length === 0) {
                  return (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center py-6 text-gray-500">No destinations</TableCell>
                      </TableRow>
                  );
                }

                return filtered.map((d) => {
                  const trip = tripsFromStorage.find((t) => String(t.destination || "") === String(d.address || d.name));
                  // if a trip exists but doesn't match the filter, skip this destination row
                  if (trip && !matchesFilter(trip)) return null;
                  return (
                    <TableRow key={d.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center h-12">
                          <span className="text-sm text-muted-foreground">{trip ? trip.id : '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center h-12">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{trucks.find((t) => t.id === d.truckId)?.name || '—'}</div>
                            <div className="text-xs text-muted-foreground">{trucks.find((t) => t.id === d.truckId)?.id || d.truckId || '—'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center h-12">
                          <div className="flex-1 min-w-0">
                            <div className="truncate">{trip?.driverName || trucks.find((t) => t.id === d.truckId)?.driver || '—'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{trip?.startTime ? format(new Date(trip.startTime), 'yyyy-MM-dd h:mm a') : '—'}</TableCell>
                      <TableCell>{trip?.status === 'intransit' ? '—' : (trip?.endTime ? format(new Date(trip.endTime), 'yyyy-MM-dd h:mm a') : '—')}</TableCell>
                      <TableCell>{trip?.status ? getStatusBadge(trip.status) : '—'}</TableCell>
                      <TableCell className="text-right">
                            <Button size="sm" variant="default" onClick={(e) => {
                              e.stopPropagation();
                              setViewingDestination(d);
                              setViewingTrip(trip || null);
                              try {
                                if (trip && trip.status === 'intransit') {
                                  const oLat = trip.originLat ?? trip.origin?.lat;
                                  const oLng = trip.originLng ?? trip.origin?.lng;
                                  const dLat = trip.destLat ?? trip.destination?.lat;
                                  const dLng = trip.destLng ?? trip.destination?.lng;
                                  if (typeof oLat === 'number' && typeof oLng === 'number' && typeof dLat === 'number' && typeof dLng === 'number') {
                                    const start = trip.startTime ? new Date(trip.startTime).getTime() : Date.now();
                                    const end = trip.endTime ? new Date(trip.endTime).getTime() : (start + 60 * 60 * 1000);
                                    const frac = Math.max(0, Math.min(1, (Date.now() - start) / Math.max(1, end - start)));
                                    setFocusPosition({ lat: oLat + (dLat - oLat) * frac, lng: oLng + (dLng - oLng) * frac });
                                    setFocusLabel(String(trip.truckId || trip.id || ''));
                                  } else setFocusPosition(null);
                                } else setFocusPosition(null);
                              } catch (e) { setFocusPosition(null); }
                              setIsViewOpen(true);
                            }}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                }).filter(Boolean)
              })()}
            </TableBody>
          </Table>
        </div>
      </div>

          {/* View dialog for trips/destinations */}
          <Dialog open={isViewOpen} onOpenChange={(open) => { if (!open) { setViewingDestination(null); setViewingTrip(null); } setIsViewOpen(open); }}>
            <DialogContent className="sm:max-w-[700px]">
              {viewingDestination ? (
                <DestinationDetails destination={viewingDestination} setDestinations={(fn) => setDestinations(fn as any)} />
              ) : viewingTrip ? (
                <div className="grid gap-4">
                  <h3 className="text-lg font-semibold">Trip {viewingTrip.id}</h3>
                  <div>Truck: {trucks.find((t) => String(t.id) === String(viewingTrip.truckId))?.name || viewingTrip.truckId}</div>
                  <div>Driver: {viewingTrip.driverName || viewingTrip.driver || '—'}</div>
                  <div>Origin: {viewingTrip.origin || '—'}</div>
              <div>Destination: {viewingTrip.destination || '—'}</div>
              <div>Start: {viewingTrip.startTime ? format(new Date(viewingTrip.startTime), 'yyyy-MM-dd h:mm a') : '—'}</div>
              <div>End: {viewingTrip.status === 'intransit' ? '—' : (viewingTrip.endTime ? format(new Date(viewingTrip.endTime), 'yyyy-MM-dd h:mm a') : '—')}</div>
                  <div>Status: {viewingTrip.status || '—'}</div>
                </div>
              ) : (
                <div>No item selected</div>
              )}
            </DialogContent>
          </Dialog>
    </div>
  );
};
const DestinationDetails = ({ destination, setDestinations }: { destination: DestinationType; setDestinations: (fn: (d: DestinationType[]) => DestinationType[] ) => void }) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { toast } = useToast();
  return (
    <div className="grid gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{destination.name}</h2>
          <p className="text-muted-foreground">
            {destination.address}, {destination.city}, {destination.state}
          </p>
        </div>
        <>
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Edit Details</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget as HTMLFormElement);
                const updated: Partial<DestinationType> = {
                  name: String(fd.get('name') || ''),
                  address: String(fd.get('address') || ''),
                  city: String(fd.get('city') || ''),
                  state: String(fd.get('state') || ''),
                  type: (fd.get('type') as DestinationType['type']) || destination.type,
                };
                setDestinations((prev) => prev.map((d) => d.id === destination.id ? { ...d, ...updated } : d));
                setIsEditOpen(false);
                toast({ title: 'Destination updated', description: 'Changes saved.' });
              }}>
                <DialogHeader>
                  <DialogTitle>Edit Destination</DialogTitle>
                  <DialogDescription>Update destination details for {destination.name}.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input id="name" name="name" defaultValue={destination.name} className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="address" className="text-right">Address</Label>
                    <Input id="address" name="address" defaultValue={destination.address} className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="city" className="text-right">City</Label>
                    <Input id="city" name="city" defaultValue={destination.city} className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="state" className="text-right">Province</Label>
                    <Input id="state" name="state" defaultValue={destination.state} className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">Type</Label>
                    <Select name="type" defaultValue={destination.type}>
                      <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="warehouse">Warehouse</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="distribution">Distribution</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Save</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <h3 className="font-medium">Destination Type</h3>
          <p className="capitalize mt-1">{destination.type}</p>
        </div>
      </div>
    </div>
  );
};

export default Destinations;
