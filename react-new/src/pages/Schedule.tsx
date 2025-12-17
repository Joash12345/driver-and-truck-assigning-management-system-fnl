import { useState, useEffect } from "react";
import { format, addDays, startOfWeek, addWeeks } from "date-fns";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Clock,
  Filter,
  Truck,
  PlusCircle,
} from "lucide-react";
import { useTruckContext } from "@/context/TruckContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
// Avatar removed: do not display initials in schedule
import StatusBadge from "@/components/ui/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/contexts/NotificationContext";
import NewAssignmentDialog from "@/components/schedule/NewAssignmentDialog";

interface Trip {
  id: string;
  truckId: string;
  driverId: string;
  driverName: string;
  driverInitials: string;
  origin: string;
  destination: string;
  startTime: Date;
  endTime: Date;
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  travelTimeSeconds?: number;
  eta?: Date;
  cargo?: string;
  cargoTons?: string;
  notes?: string;
  status: "pending" | "intransit" | "completed" | "cancelled";
}

// No demo trips — schedule should load from localStorage only.

const Schedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"day" | "week">("week");
  const [statusFilter, setStatusFilter] = useState<string[]>([
    "pending",
    "intransit",
    "completed",
  ]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const { trucks, updateTruck } = useTruckContext();
  const { toast: notifyToast } = useToast();
  const { addNotification } = useNotifications();
  const [trips, setTrips] = useState<Trip[]>(() => {
    try {
      const raw = localStorage.getItem("trips");
      if (raw) {
          const parsed = JSON.parse(raw) as any[];
          return parsed.map((t) => ({
            ...t,
            startTime: t.startTime ? new Date(t.startTime) : new Date(),
            endTime: t.endTime ? new Date(t.endTime) : undefined,
            eta: t.eta ? new Date(t.eta) : undefined,
          })) as Trip[];
      }
      return [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("trips", JSON.stringify(trips));
      try { window.dispatchEvent(new Event('trips-updated')); } catch (e) {}
    } catch (e) {
      // ignore
    }
  }, [trips]);

  // keep in sync with other tabs/components that may update localStorage
  useEffect(() => {
    const handleStorage = (ev: StorageEvent) => {
      if (ev.key === 'trips') {
        try {
          const raw = ev.newValue;
          if (raw) {
            const parsed = JSON.parse(raw) as any[];
            const mapped = parsed.map((t) => ({
              ...t,
              startTime: t.startTime ? new Date(t.startTime) : new Date(),
              endTime: t.endTime ? new Date(t.endTime) : undefined,
              eta: t.eta ? new Date(t.eta) : undefined,
            }));
            setTrips(mapped as Trip[]);
          } else {
            setTrips([]);
          }
        } catch (e) {
          // ignore parse errors
        }
      }
    };

    const handleCustom = () => {
      try {
        const raw = localStorage.getItem('trips');
        if (raw) {
          const parsed = JSON.parse(raw) as any[];
          const mapped = parsed.map((t) => ({
            ...t,
            startTime: t.startTime ? new Date(t.startTime) : new Date(),
            endTime: t.endTime ? new Date(t.endTime) : undefined,
            eta: t.eta ? new Date(t.eta) : undefined,
          }));
          setTrips(mapped as Trip[]);
        }
      } catch (e) {}
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('trips-updated', handleCustom);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('trips-updated', handleCustom);
    };
  }, []);

  const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 });

  const filteredTrips = trips.filter((trip) => statusFilter.includes(trip.status));

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfCurrentWeek, i));

  const handleNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };

  const handlePrevWeek = () => {
    setCurrentDate(addWeeks(currentDate, -1));
  };

  const handleTodayClick = () => {
    setCurrentDate(new Date());
  };

  // Periodically recalculate statuses so pending -> intransit happens automatically
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      // compute new trips
      setTrips((prev) => {
        const newTrips = prev.map((t) => {
          if (t.status === 'completed' || t.status === 'cancelled') return t;
          if (t.startTime.getTime() > now) return t.status === 'pending' ? t : { ...t, status: 'pending' as Trip['status'] };
          if (t.endTime && t.endTime.getTime() <= now) {
            // Trip completed
            if (t.status !== 'completed') {
              const completeDesc = `Trip for ${t.driverName} to ${t.destination.substring(0, 30)} has been completed`;
              notifyToast({
                title: "Trip Completed",
                description: completeDesc
              });
              addNotification({ title: "Trip Completed", message: completeDesc, type: 'info', url: '/schedule' });
            }
            return t.status === 'completed' ? t : { ...t, status: 'completed' as Trip['status'] };
          }
          // Trip started (pending -> intransit)
          if (t.status === 'pending') {
            const startDesc = `${t.driverName} has started the trip to ${t.destination.substring(0, 30)}`;
            notifyToast({
              title: "Trip Started",
              description: startDesc
            });
            addNotification({ title: "Trip Started", message: startDesc, type: 'info', url: '/schedule' });
          }
          return t.status === 'intransit' ? t : { ...t, status: 'intransit' as Trip['status'] };
        });

        // After computing newTrips, update truck statuses to match trip states
        try {
          // map truckId -> desired status
          // Preserve 'pending' for scheduled future trips so trucks/drivers remain pending
          // Priority: intransit > pending > completed
          const truckStatusMap: Record<string, 'intransit' | 'assigned' | 'pending'> = {};
          newTrips.forEach((tr) => {
            const id = tr.truckId;
            if (!id) return;
            if (tr.status === 'intransit') {
              truckStatusMap[id] = 'intransit';
            } else if (tr.status === 'pending' && truckStatusMap[id] !== 'intransit') {
              // keep truck pending for future scheduled trips
              truckStatusMap[id] = 'pending';
            } else if (tr.status === 'completed' && truckStatusMap[id] !== 'intransit' && truckStatusMap[id] !== 'pending') {
              // treat completed trips as assigned so truck/driver remain assigned after completion
              truckStatusMap[id] = 'assigned';
            }
            // do not set 'available' here -- leave truck's existing status unchanged when trip is cancelled or no trips
          });

          // apply status updates to trucks and drivers
          Object.keys(truckStatusMap).forEach((truckId) => {
            const desired = truckStatusMap[truckId];
            // Read latest trucks from localStorage to avoid stale closure issues
            let truckObj: any | undefined;
            try {
              const rawTrucks = localStorage.getItem('trucks');
              const trucksArr = rawTrucks ? (JSON.parse(rawTrucks) as any[]) : [];
              truckObj = trucksArr.find((t) => String(t.id) === String(truckId));
            } catch (e) {
              truckObj = trucks.find((t) => t.id === truckId);
            }
            if (!truckObj) return;
            if (truckObj.status !== desired) {
              try {
                // update localStorage first to ensure persistence
                try {
                  const rawTrucks = localStorage.getItem('trucks');
                  const trucksArr = rawTrucks ? (JSON.parse(rawTrucks) as any[]) : [];
                  const updatedArr = trucksArr.map((tt) => (String(tt.id) === String(truckId) ? { ...tt, status: desired } : tt));
                  if (trucksArr.length) {
                    localStorage.setItem('trucks', JSON.stringify(updatedArr));
                  }
                } catch (e) {
                  // ignore localStorage write errors
                }

                // then update context
                updateTruck({ ...truckObj, status: desired });
              } catch (e) {}
            }

            // update driver status in localStorage if a driver is assigned to this truck
            try {
              const raw = localStorage.getItem('drivers');
              if (raw) {
                const drivers = JSON.parse(raw) as any[];

                // try to find a representative trip for this truck so we can match by driverId or driverName
                const tripForTruck = newTrips.find((tr) => String(tr.truckId) === String(truckId) && (tr.status === desired || (desired === 'pending' && tr.status === 'pending')));
                const candidateDriverId = tripForTruck?.driverId;
                const candidateDriverName = tripForTruck?.driverName || truckObj.driver;

                const normalize = (s?: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                const candNorm = normalize(candidateDriverName || "");
                  const updated = drivers.map((d) => {
                    const assignedVal = String(d.assignedVehicle || "");
                    const tId = String(truckId || "");
                    const matchesAssigned = assignedVal && (assignedVal === tId || assignedVal.includes(tId) || tId.includes(assignedVal));
                    const matchesId = candidateDriverId && String(d.id) === String(candidateDriverId);

                  if (matchesAssigned || matchesId) {
                    if (desired === 'intransit') return { ...d, status: 'driving', assignedVehicle: d.assignedVehicle || String(truckId) };
                    if (desired === 'pending') return { ...d, status: 'pending', assignedVehicle: d.assignedVehicle || String(truckId) };
                    if (desired === 'assigned') return { ...d, status: 'assigned', assignedVehicle: d.assignedVehicle || String(truckId) };
                  }
                  return d;
                });

                localStorage.setItem('drivers', JSON.stringify(updated));
                try { window.dispatchEvent(new Event('drivers-updated')); } catch (e) {}
              }
            } catch (e) {
              // ignore
            }
          });
        } catch (e) {
          // ignore errors updating trucks/drivers
        }

        return newTrips;
      });
    };

    tick();
    const id = setInterval(tick, 30 * 1000); // check every 30s
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "intransit":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTimeRange = (start: Date, end: Date) => {
    return `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`;
  };

  const handleAddTrip = async (tripData: any) => {
    try {
      const start = tripData.departureTime ? new Date(tripData.departureTime) : new Date();

      // ETA calculation using haversine fallback
      const avgSpeedKmh = 60; // default average speed
      const routingFactor = 1.3; // approximate road distance multiplier
      const bufferMinutes = 15; // buffer time to add

      const oLat = tripData.origin?.lat;
      const oLng = tripData.origin?.lng;
      const dLat = tripData.destination?.lat;
      const dLng = tripData.destination?.lng;

      const toRad = (v: number) => (v * Math.PI) / 180;
      let travelSeconds = 8 * 3600; // fallback 8 hours
      let etaDate = new Date(start.getTime() + travelSeconds * 1000);

      if (
        typeof oLat === "number" &&
        typeof oLng === "number" &&
        typeof dLat === "number" &&
        typeof dLng === "number"
      ) {
        const R = 6371; // km
        const dLatRad = toRad(dLat - oLat);
        const dLonRad = toRad(dLng - oLng);
        const a =
          Math.sin(dLatRad / 2) * Math.sin(dLatRad / 2) +
          Math.cos(toRad(oLat)) * Math.cos(toRad(dLat)) *
          Math.sin(dLonRad / 2) * Math.sin(dLonRad / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceKm = R * c;

        const roadDistanceKm = distanceKm * routingFactor;
        const durationHours = roadDistanceKm / avgSpeedKmh;
        travelSeconds = Math.max(60, Math.round(durationHours * 3600 + bufferMinutes * 60));
        etaDate = new Date(start.getTime() + travelSeconds * 1000);
      }

      const truck = trucks.find((t) => t.id === tripData.truckId);

      // Determine assigned driver id/name from drivers storage (truck.driver is a name)
      let driverName = truck?.driver || "Unassigned";
      let driverId = "";
      try {
        const rawDrivers = localStorage.getItem('drivers');
        if (rawDrivers) {
          const driversArr = JSON.parse(rawDrivers) as any[];
          const normalize = (s?: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
          const drvNameNorm = normalize(truck?.driver || "");
          const assigned = driversArr.find((d) => {
            // match strictly by assignedVehicle only to avoid false positives
            if (!d.assignedVehicle) return false;
            return String(d.assignedVehicle) === String(truck?.id);
          });
          if (assigned) {
            driverId = assigned.id;
            driverName = assigned.name || driverName;
          }
        }
      } catch (e) {
        // ignore
      }

      const driverInitials = driverName
        .split(" ")
        .map((s: string) => s[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

      const status = start.getTime() > Date.now() ? "pending" : "intransit";

      const newTrip: Trip = {
        id: `TRIP-${Date.now()}`,
        truckId: tripData.truckId,
        driverId: driverId || "",
        driverName,
        driverInitials,
        origin: tripData.origin?.address || "",
        destination: tripData.destination?.address || "",
        originLat: tripData.origin?.lat,
        originLng: tripData.origin?.lng,
        destLat: tripData.destination?.lat,
        destLng: tripData.destination?.lng,
        startTime: start,
        endTime: etaDate,
        travelTimeSeconds: travelSeconds,
        eta: etaDate,
        cargo: tripData.cargo || '',
        cargoTons: tripData.cargoTons || '',
        notes: tripData.notes || '',
        status,
      };

      setTrips((prev) => [newTrip, ...prev]);
      // best-effort persist to backend
      try {
        await apiFetch('/api/trips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: newTrip.id,
            truck_id: newTrip.truckId,
            driver_id: newTrip.driverId,
            driver_name: newTrip.driverName,
            origin: newTrip.origin,
            destination: newTrip.destination,
            start_time: newTrip.startTime?.toISOString(),
            end_time: newTrip.endTime?.toISOString(),
            travel_time_seconds: newTrip.travelTimeSeconds,
            origin_lat: newTrip.originLat,
            origin_lng: newTrip.originLng,
            dest_lat: newTrip.destLat,
            dest_lng: newTrip.destLng,
            status: newTrip.status,
            cargo: newTrip.cargo,
            cargo_tons: newTrip.cargoTons,
            notes: newTrip.notes,
          }),
        });
      } catch (err) {
        // ignore - local fallback already updated
      }
      const tripDesc = `Trip assigned to ${driverName} from ${tripData.origin?.address?.substring(0, 30) || 'origin'} to ${tripData.destination?.address?.substring(0, 30) || 'destination'}`;
      notifyToast({
        title: "New Trip Scheduled",
        description: tripDesc
      });
      addNotification({ title: "New Trip Scheduled", message: tripDesc, type: 'info', url: '/schedule' });
      setIsDialogOpen(false);

      // If the schedule is pending, mark truck and driver as pending
          try {
            if (status === 'pending') {
              const truckObj = trucks.find((t) => String(t.id) === String(newTrip.truckId));
              if (truckObj && truckObj.status !== 'pending') {
                try { updateTruck({ ...truckObj, status: 'pending' }); } catch (e) {}
              }

              try {
                const raw = localStorage.getItem('drivers');
                if (raw) {
                  const drivers = JSON.parse(raw) as any[];

                  // prefer driverId from trip if present
                  const candidateDriverId = newTrip.driverId;
                  const candidateDriverName = newTrip.driverName || truckObj?.driver;

                  const normalize = (s?: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                  const candNorm = normalize(candidateDriverName || "");
                  const updated = drivers.map((d) => {
                    const assignedVal = String(d.assignedVehicle || "");
                    const tId = String(newTrip.truckId || "");
                    const matchesAssigned = assignedVal && (assignedVal === tId || assignedVal.includes(tId) || tId.includes(assignedVal));
                    const matchesId = candidateDriverId && String(d.id) === String(candidateDriverId);

                    if (matchesAssigned || matchesId) {
                      return { ...d, status: 'pending', assignedVehicle: d.assignedVehicle || String(newTrip.truckId) };
                    }
                    return d;
                  });
                  localStorage.setItem('drivers', JSON.stringify(updated));
                  try { window.dispatchEvent(new Event('drivers-updated')); } catch (e) {}
                }
              } catch (e) {
                // ignore
              }
            }
          } catch (e) {
            // ignore
          }
    } catch (e) {
      console.error("Failed to add trip", e);
      setIsDialogOpen(false);
    }
  };

  const handleTripClick = (trip: Trip) => {
    setSelectedTrip(trip);
    // If trip is completed, open a read-only view dialog instead of edit
    if (trip.status === "completed") {
      setIsViewOpen(true);
      return;
    }
    setIsEditOpen(true);
  };

  const handleUpdateTrip = async (tripData: any) => {
    try {
      const id = tripData.id;
      const start = tripData.departureTime ? new Date(tripData.departureTime) : new Date();

      const avgSpeedKmh = 60;
      const routingFactor = 1.3;
      const bufferMinutes = 15;

      const oLat = tripData.origin?.lat;
      const oLng = tripData.origin?.lng;
      const dLat = tripData.destination?.lat;
      const dLng = tripData.destination?.lng;

      const toRad = (v: number) => (v * Math.PI) / 180;
      let travelSeconds = 8 * 3600;
      let etaDate = new Date(start.getTime() + travelSeconds * 1000);

      if (
        typeof oLat === "number" &&
        typeof oLng === "number" &&
        typeof dLat === "number" &&
        typeof dLng === "number"
      ) {
        const R = 6371;
        const dLatRad = toRad(dLat - oLat);
        const dLonRad = toRad(dLng - oLng);
        const a =
          Math.sin(dLatRad / 2) * Math.sin(dLatRad / 2) +
          Math.cos(toRad(oLat)) * Math.cos(toRad(dLat)) *
          Math.sin(dLonRad / 2) * Math.sin(dLonRad / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceKm = R * c;

        const roadDistanceKm = distanceKm * routingFactor;
        const durationHours = roadDistanceKm / avgSpeedKmh;
        travelSeconds = Math.max(60, Math.round(durationHours * 3600 + bufferMinutes * 60));
        etaDate = new Date(start.getTime() + travelSeconds * 1000);
      }

      const newStatus = start.getTime() > Date.now() ? "pending" : "intransit";

      setTrips((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                truckId: tripData.truckId,
                driverId: tripData.driverId || t.driverId,
                driverName: tripData.driverName || t.driverName,
                driverInitials: tripData.driverInitials || t.driverInitials,
                origin: tripData.origin?.address || t.origin,
                destination: tripData.destination?.address || t.destination,
                originLat: tripData.origin?.lat ?? t.originLat,
                originLng: tripData.origin?.lng ?? t.originLng,
                destLat: tripData.destination?.lat ?? t.destLat,
                destLng: tripData.destination?.lng ?? t.destLng,
                startTime: start,
                endTime: etaDate,
                travelTimeSeconds: travelSeconds,
                eta: etaDate,
                cargo: tripData.cargo || t['cargo'] || '',
                cargoTons: tripData.cargoTons || t['cargoTons'] || '',
                notes: tripData.notes || t['notes'] || '',
                status: (t.status === 'completed' || t.status === 'cancelled') ? t.status : newStatus,
              }
            : t
        )
      );

      notifyToast({
        title: "Trip Updated",
        description: `Trip schedule has been updated successfully`
      });
      setIsEditOpen(false);
      setSelectedTrip(null);
      // best-effort persist update
      try {
        await apiFetch(`/api/trips/${tripData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            truck_id: tripData.truckId,
            driver_id: tripData.driverId,
            driver_name: tripData.driverName,
            origin: tripData.origin?.address || undefined,
            destination: tripData.destination?.address || undefined,
            start_time: tripData.departureTime ? new Date(tripData.departureTime).toISOString() : undefined,
            end_time: (tripData.departureTime ? new Date(tripData.departureTime) : new Date()).toISOString(),
            travel_time_seconds: undefined,
            origin_lat: tripData.origin?.lat,
            origin_lng: tripData.origin?.lng,
            dest_lat: tripData.destination?.lat,
            dest_lng: tripData.destination?.lng,
            status: undefined,
            cargo: tripData.cargo,
            cargo_tons: tripData.cargoTons,
            notes: tripData.notes,
          }),
        });
      } catch (err) {
        // ignore
      }
      // If updated status is pending, mark truck and driver as pending
      try {
        if (newStatus === 'pending') {
          const truckObj = trucks.find((t) => String(t.id) === String(tripData.truckId));
          if (truckObj && truckObj.status !== 'pending') {
            try { updateTruck({ ...truckObj, status: 'pending' }); } catch (e) {}
          }

          try {
            const raw = localStorage.getItem('drivers');
            if (raw) {
              const drivers = JSON.parse(raw) as any[];

              const candidateDriverId = tripData.driverId || null;
              const candidateDriverName = tripData.driverName || truckObj?.driver;

                const updated = drivers.map((d) => {
                  const assignedVal = String(d.assignedVehicle || "");
                  const tId = String(tripData.truckId || "");
                  const matchesAssigned = assignedVal && (assignedVal === tId || assignedVal.includes(tId) || tId.includes(assignedVal));
                  const matchesId = candidateDriverId && String(d.id) === String(candidateDriverId);

                  if (matchesAssigned || matchesId) {
                    return { ...d, status: 'pending', assignedVehicle: d.assignedVehicle || String(tripData.truckId) };
                  }
                  return d;
                });
              localStorage.setItem('drivers', JSON.stringify(updated));
              try { window.dispatchEvent(new Event('drivers-updated')); } catch (e) {}
            }
          } catch (e) {
            // ignore
          }
        }
      } catch (e) {
        // ignore
      }
    } catch (e) {
      console.error("Failed to update trip", e);
      setIsEditOpen(false);
      setSelectedTrip(null);
    }
  };

  const handleDeleteTrip = async (id: string) => {
    // find the trip being deleted so we can restore statuses
    const tripToDelete = trips.find((t) => t.id === id);

    // remove trip from state
    // try backend delete
    try {
      await apiFetch(`/api/trips/${id}`, { method: 'DELETE' });
    } catch (err) {
      // ignore
    }

    setTrips((prev) => prev.filter((t) => t.id !== id));
    notifyToast({
      title: "Trip Cancelled",
      description: `Trip has been cancelled and removed from schedule`
    });
    setIsEditOpen(false);
    setSelectedTrip(null);

    if (!tripToDelete) return;

    try {
      // only restore truck status to 'assigned' if there are no other active trips for that truck
      const hasOtherActiveTripsForTruck = trips.some((t) => t.id !== tripToDelete.id && String(t.truckId) === String(tripToDelete.truckId) && t.status !== 'completed');
      const truckObj = trucks.find((t) => String(t.id) === String(tripToDelete.truckId));
      if (truckObj && !hasOtherActiveTripsForTruck) {
        try { updateTruck({ ...truckObj, status: 'assigned' }); } catch (e) {}
      }
    } catch (e) {
      // ignore
    }

    try {
      // update drivers in localStorage: if a driver is linked to this truck or trip, set to 'assigned' only if they have no other active trips
      const raw = localStorage.getItem('drivers');
      if (raw) {
        const drivers = JSON.parse(raw) as any[];
        const updated = drivers.map((d) => {
          const assignedVal = String(d.assignedVehicle || "");
          const tId = String(tripToDelete.truckId || "");
          const matchesAssignedVehicle = assignedVal && (assignedVal === tId || assignedVal.includes(tId) || tId.includes(assignedVal));
          const matchesDriverId = String(d.id) === String(tripToDelete.driverId);

          if (matchesAssignedVehicle || matchesDriverId) {
            const hasOtherActiveTripsForDriver = trips.some((t) => t.id !== tripToDelete.id && (String(t.driverId) === String(d.id) || String(t.truckId) === String(d.assignedVehicle)) && t.status !== 'completed');
            if (!hasOtherActiveTripsForDriver) {
              return { ...d, status: 'assigned', assignedVehicle: tripToDelete.truckId };
            }
            return d;
          }
          return d;
        });
        localStorage.setItem('drivers', JSON.stringify(updated));
        try { window.dispatchEvent(new Event('drivers-updated')); } catch (e) {}
      }
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="space-y-8 content-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
        <Button
          className="flex items-center gap-2"
          onClick={() => setIsDialogOpen(true)}
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Assignment</span>
        </Button>
      </div>
      {/* pass used truck ids (pending/intransit) so dialog can exclude them */}
      <NewAssignmentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleAddTrip}
        usedTruckIds={trips.filter(t => t.status === 'pending' || t.status === 'intransit').map(t => t.truckId)}
      />
      <NewAssignmentDialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) setSelectedTrip(null);
        }}
        onSubmit={handleUpdateTrip}
        onDelete={(id) => handleDeleteTrip(id)}
        initialData={selectedTrip || undefined}
        usedTruckIds={trips
          .filter((t) => (t.status === 'pending' || t.status === 'intransit') && t.id !== selectedTrip?.id)
          .map((t) => t.truckId)}
      />

      {/* Read-only view for completed trips */}
      <Dialog open={isViewOpen} onOpenChange={(open) => { setIsViewOpen(open); if (!open) setSelectedTrip(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Completed Schedule</DialogTitle>
          </DialogHeader>
          {selectedTrip && (
            <div className="space-y-4 mt-2">
              <div>
                <div className="text-sm text-muted-foreground">Trip ID</div>
                <div className="font-medium">{selectedTrip.id}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Truck</div>
                <div className="font-medium">{selectedTrip.truckId}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Driver</div>
                <div className="font-medium">{selectedTrip.driverName}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Origin</div>
                  <div className="font-medium">{selectedTrip.origin}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Destination</div>
                  <div className="font-medium">{selectedTrip.destination}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Departure</div>
                  <div className="font-medium">{format(selectedTrip.startTime, "yyyy-MM-dd h:mm a")}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Arrival</div>
                  <div className="font-medium">{selectedTrip.endTime ? format(selectedTrip.endTime, "yyyy-MM-dd h:mm a") : '-'}</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Notes</div>
                <div className="font-medium">{selectedTrip.notes || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <div className="font-medium">{selectedTrip.status}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsViewOpen(false); setSelectedTrip(null); }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="px-6 pt-6 pb-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-xl">Trip Schedule</CardTitle>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-1">
                    <Filter className="h-4 w-4" />
                    <span>Filter</span>
                    <ChevronsUpDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={statusFilter.includes("pending")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setStatusFilter([...statusFilter, "pending"]);
                      } else {
                        setStatusFilter(
                          statusFilter.filter((item) => item !== "pending")
                        );
                      }
                    }}
                  >
                    Pending
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilter.includes("intransit")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setStatusFilter([...statusFilter, "intransit"]);
                      } else {
                        setStatusFilter(
                          statusFilter.filter((item) => item !== "intransit")
                        );
                      }
                    }}
                  >
                    In Transit
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilter.includes("completed")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setStatusFilter([...statusFilter, "completed"]);
                      } else {
                        setStatusFilter(
                          statusFilter.filter((item) => item !== "completed")
                        );
                      }
                    }}
                  >
                    Completed
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilter.includes("cancelled")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setStatusFilter([...statusFilter, "cancelled"]);
                      } else {
                        setStatusFilter(
                          statusFilter.filter((item) => item !== "cancelled")
                        );
                      }
                    }}
                  >
                    Cancelled
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex items-center rounded-md border">
                <Button
                  variant="ghost"
                  className={`rounded-none ${
                    view === "day" ? "bg-muted" : ""
                  }`}
                  onClick={() => setView("day")}
                >
                  Day
                </Button>
                <Button
                  variant="ghost"
                  className={`rounded-none ${
                    view === "week" ? "bg-muted" : ""
                  }`}
                  onClick={() => setView("week")}
                >
                  Week
                </Button>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevWeek}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="px-3"
                  onClick={handleTodayClick}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextWeek}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <CardDescription className="mt-2">
            {view === "week"
              ? `${format(startOfCurrentWeek, "MMMM d, yyyy")} - ${format(
                  addDays(startOfCurrentWeek, 6),
                  "MMMM d, yyyy"
                )}`
              : format(currentDate, "MMMM d, yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {view === "week" ? (
            <div className="overflow-x-auto pb-6">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-7 mb-4">
                  {weekDays.map((day, i) => (
                    <div
                      key={i}
                      className={`text-center p-2 ${
                        format(day, "yyyy-MM-dd") ===
                        format(new Date(), "yyyy-MM-dd")
                          ? "bg-primary/10 rounded-md font-medium"
                          : ""
                      }`}
                    >
                      <div className="text-sm text-muted-foreground">
                        {format(day, "EEE")}
                      </div>
                      <div className="text-lg">{format(day, "d")}</div>
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-2 mt-2">
                  {weekDays.map((day, dayIndex) => {
                    const dayTrips = filteredTrips.filter(
                      (trip) => format(trip.startTime, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
                    );
                    
                    return (
                      <div key={dayIndex} className="min-h-[200px]">
                        {dayTrips.length > 0 ? (
                          <div className="space-y-2">
                            {dayTrips.map((trip) => (
                              <div
                                key={trip.id}
                                className="p-2 rounded-md border text-left cursor-pointer hover:shadow-sm transition-shadow"
                                onClick={() => handleTripClick(trip)}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Truck className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-medium">
                                      {trip.truckId}
                                    </span>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className={`${getStatusColor(
                                      trip.status
                                    )} border-none text-xs`}
                                  >
                                    {trip.status === "intransit"
                                      ? "In Transit"
                                      : trip.status.charAt(0).toUpperCase() +
                                        trip.status.slice(1)}
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center gap-2 mb-1">
                                  <div>
                                    <div className="text-sm font-medium">{trip.driverName}</div>
                                    {trip.eta && (
                                      <div className="text-xs text-muted-foreground">
                                        ETA: {format(trip.eta, "h:mm a")}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* origin/destination hidden in calendar view */}
                                
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3 mr-1" />
                                  <span>
                                    {formatTimeRange(trip.startTime, trip.endTime)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center border border-dashed rounded-md p-4">
                            <span className="text-sm text-muted-foreground">
                              No trips
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                {format(currentDate, "EEEE, MMMM d, yyyy")}
              </h3>
              
              <div className="space-y-2">
                {filteredTrips
                  .filter(
                    (trip) =>
                      format(trip.startTime, "yyyy-MM-dd") ===
                      format(currentDate, "yyyy-MM-dd")
                  )
                    .map((trip) => (
                    <div
                      key={trip.id}
                      className="flex items-center gap-4 p-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleTripClick(trip)}
                    >
                      <div className="flex-shrink-0 flex flex-col items-center justify-center h-14 w-14 rounded-md bg-primary/5 border">
                        <span className="text-xs text-muted-foreground">
                          {format(trip.startTime, "h:mm")}
                        </span>
                        <span className="text-xs font-medium">
                          {format(trip.startTime, "a")}
                        </span>
                        <div className="h-px w-8 bg-muted my-1" />
                        <span className="text-xs text-muted-foreground">
                          {format(trip.endTime, "h:mm")}
                        </span>
                        <span className="text-xs font-medium">
                          {format(trip.endTime, "a")}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="bg-primary/10 text-primary border-none flex items-center"
                            >
                              <Truck className="h-3 w-3 mr-1" />
                              {trip.truckId}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {trip.id}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className={`${getStatusColor(
                              trip.status
                            )} border-none`}
                          >
                            {trip.status === "intransit"
                              ? "In Transit"
                              : trip.status.charAt(0).toUpperCase() +
                                trip.status.slice(1)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium truncate">{trip.driverName}</span>
                        </div>
                        
                        {/* origin/destination hidden in day list view */}
                      </div>
                      
                      <div>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); }}>
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                
                {filteredTrips.filter(
                  (trip) =>
                    format(trip.startTime, "yyyy-MM-dd") ===
                    format(currentDate, "yyyy-MM-dd")
                ).length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 border border-dashed rounded-md bg-muted/5">
                    <Calendar className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No trips scheduled</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      There are no trips scheduled for this day.
                    </p>
                    <Button variant="outline" className="mt-4">
                      Schedule a Trip
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Trip History</CardTitle>
            <div />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Table>
            <TableCaption>All trips (most recent first)</TableCaption>
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
              {trips
                .slice()
                .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
                .map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.id}</TableCell>
                    <TableCell>{t.truckId}</TableCell>
                    <TableCell>{t.driverName}</TableCell>
                    <TableCell>{format(t.startTime, "yyyy-MM-dd h:mm a")}</TableCell>
                    <TableCell>{t.endTime ? format(t.endTime, "yyyy-MM-dd h:mm a") : "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${getStatusColor(t.status)} border-none text-xs`
                      }
                      >
                        {t.status === "intransit"
                          ? "In Transit"
                          : t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleTripClick(t)}>View</Button>
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleDeleteTrip(t.id); }}>Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Schedule;
