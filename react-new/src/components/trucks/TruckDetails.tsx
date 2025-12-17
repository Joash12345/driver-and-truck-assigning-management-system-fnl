import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Calendar,
  Droplets,
  Edit2,
  Gauge,
  MapPin,
  Wrench,
  Truck,
  User,
  UserPlus,
  Clock,
  FileText,
  Mail,
  Phone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatusBadge from "@/components/ui/StatusBadge";
import type { TruckType } from "@/types/truck";
import { useTruckContext } from "@/context/TruckContext";
import { format } from "date-fns";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/contexts/NotificationContext";
import TrackingMap from "@/components/tracking/TrackingMap";
import { DocumentItem } from "@/components/drivers/DriverDetails";
import { apiFetch } from '@/lib/api';

interface TruckDetailsProps {
  truck: TruckType;
}

const TruckDetails: React.FC<TruckDetailsProps> = ({ truck }) => {
  const { toast: notifyToast } = useToast();
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const [maintenanceType, setMaintenanceType] = useState<string>("routine");
  const [maintenanceDate, setMaintenanceDate] = useState<string>("");
  const [maintenanceNotes, setMaintenanceNotes] = useState<string>("");
  const [maintenances, setMaintenances] = useState<Array<any>>([]);
  const [schedules, setSchedules] = useState<Array<any>>([]);
  const [tripHistories, setTripHistories] = useState<Array<any>>([]);
  const [isAssignDriverOpen, setIsAssignDriverOpen] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState<Array<any>>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [isEditTripOpen, setIsEditTripOpen] = useState(false);
  const [isEditTruckOpen, setIsEditTruckOpen] = useState(false);
  const [truckData, setTruckData] = useState(truck);
  const { updateTruck, trucks } = useTruckContext();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  // keep displayed data in sync with context by id (live updates from TruckContext)
  const params = useParams();
  useEffect(() => {
    try {
      const id = params.id || truck?.id;
      const freshest = trucks.find((t) => String(t.id) === String(id)) || truck;
      setTruckData(freshest);
    } catch (e) {
      setTruckData(truck);
    }
  }, [truck, trucks, params.id]);

  // load available drivers when the assign dialog opens
  useEffect(() => {
    if (!isAssignDriverOpen) return;
    try {
      const raw = localStorage.getItem("drivers");
      if (!raw) {
        setAvailableDrivers([]);
        return;
      }
      const drivers = JSON.parse(raw) as Array<any>;
      setAvailableDrivers(drivers);
    } catch (e) {
      setAvailableDrivers([]);
    }
  }, [isAssignDriverOpen]);

  // load truck schedules (prefer backend truck_schedules, fallback to local trips)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await apiFetch('/api/truck-schedules');
        if (!res.ok) throw new Error('network');
        const rows = await res.json();
        const mapped = (rows || []).map((r: any) => ({
          id: r.id,
          truckId: r.truck_id,
          startTime: r.start_time,
          endTime: r.end_time,
          destination: r.route || r.notes || (r.data && r.data.route) || '',
          status: r.status,
          raw: r,
        }));
        if (!cancelled) setSchedules(mapped);
      } catch (e) {
        try {
          const raw = localStorage.getItem('trips');
          const arr = raw ? (JSON.parse(raw) as any[]) : [];
          const mapped = arr.map((t) => ({
            id: t.id,
            truckId: t.truckId,
            startTime: t.startTime || t.departureDate || t.date || t.departure || t.createdAt,
            endTime: t.endTime || t.arrivalDate || t.completedAt,
            destination: t.destination || t.dest || t.route || '',
            status: t.status,
            raw: t,
          }));
          if (!cancelled) setSchedules(mapped);
        } catch (err) {
          if (!cancelled) setSchedules([]);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // load trip history from backend, fallback to localStorage
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await apiFetch('/api/trip-history');
        if (!res.ok) throw new Error('network');
        const rows = await res.json();
        const mapped = (rows || []).map((r: any) => ({
          id: r.id,
          tripId: r.trip_id,
          truckId: r.truck_id,
          driverId: r.driver_id,
          driverName: r.driver_name,
          origin: r.origin,
          destination: r.destination,
          startTime: r.start_time,
          endTime: r.end_time,
          travelTimeSeconds: r.travel_time_seconds,
          status: r.status,
          notes: r.notes,
          raw: r,
        }));
        if (!cancelled) setTripHistories(mapped);
      } catch (e) {
        try {
          const raw = localStorage.getItem('trips');
          const arr = raw ? (JSON.parse(raw) as any[]) : [];
          const mapped = arr
            .filter((t) => t.status === 'completed' || t.status === 'done')
            .map((t) => ({
              id: t.id,
              tripId: t.id,
              truckId: t.truckId,
              driverId: t.driverId,
              driverName: t.driverName,
              origin: t.origin || t.from || '',
              destination: t.destination || t.dest || '',
              startTime: t.startTime || t.departureDate || t.createdAt,
              endTime: t.endTime || t.arrivalDate || t.completedAt,
              travelTimeSeconds: t.travelTimeSeconds,
              status: t.status,
              notes: t.notes,
              raw: t,
            }));
          if (!cancelled) setTripHistories(mapped);
        } catch (err) {
          if (!cancelled) setTripHistories([]);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // load maintenances for this truck
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await apiFetch('/api/scheduled-maintenance');
        if (!res.ok) throw new Error('network');
        const rows = await res.json();
        const mapped = (rows || []).map((r: any) => ({
          id: r.id,
          truckId: r.truck_id,
          type: r.title,
          date: r.scheduled_at,
          notes: (r.data && r.data.notes) || r.description || '',
          raw: r,
        }));
        if (!cancelled) setMaintenances(mapped);
      } catch (e) {
        // fallback to localStorage if backend unreachable
        try {
          const raw = localStorage.getItem('maintenances');
          if (!raw) {
            if (!cancelled) setMaintenances([]);
            return;
          }
          const arr = JSON.parse(raw) as any[];
          if (!cancelled) setMaintenances(arr);
        } catch (err) {
          if (!cancelled) setMaintenances([]);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // only drivers who are 'available' may be assigned
  const assignableDrivers = availableDrivers.filter((d) => d.status === "available");

  // try to locate full driver profile for this truck (by assignedVehicle or by name)
  const driverProfile = (() => {
    try {
      const raw = localStorage.getItem("drivers");
      if (!raw) return undefined;
      const arr = JSON.parse(raw) as any[];
      return arr.find((d) => d.assignedVehicle === truck.id || d.name === truck.driver || d.id === truck.driver);
    } catch (e) {
      return undefined;
    }
  })();

  // block unassign when truck is intransit or pending
  const isUnassignBlocked = truckData.status === 'intransit' || truckData.status === 'pending';

  const handleEditOpenChange = (open: boolean) => {
    if (open) {
      // clone the truck into local state when opening the dialog
      const newData = { ...truck } as TruckType;
      // if a driver is already assigned, reflect that by forcing status to 'assigned'
      if (newData.driver && newData.driver !== "Unassigned") {
        newData.status = "assigned" as TruckType["status"];
      }
      setTruckData(newData);
      setIsEditTruckOpen(true);
    } else {
      // reset local edits when closing without saving
      setTruckData({ ...truck });
      setIsEditTruckOpen(false);
    }
  };
  

  const handleScheduleMaintenance = () => {
    try {
      if (!maintenanceDate) {
        toast.error('Please select a maintenance date');
        return;
      }
      // try to persist to backend first
      (async () => {
        try {
          const payload = {
            truck_id: truck.id,
            title: maintenanceType,
            description: maintenanceNotes,
            scheduled_at: maintenanceDate,
            data: { notes: maintenanceNotes },
          };
          const res = await apiFetch('/api/scheduled-maintenance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error('failed');
          const created = await res.json();
          const rec = {
            id: created.id,
            truckId: created.truck_id,
            type: created.title,
            date: created.scheduled_at,
            notes: (created.data && created.data.notes) || created.description || maintenanceNotes,
            raw: created,
          };
          const newArr = [...maintenances, rec];
          setMaintenances(newArr);
          // keep a local copy as fallback
          try { localStorage.setItem('maintenances', JSON.stringify(newArr)); } catch {}
          setMaintenanceType('routine');
          setMaintenanceDate('');
          setMaintenanceNotes('');
          toast.success('Maintenance scheduled successfully');
          const maintenanceDesc = `${maintenanceType} maintenance scheduled for ${truck.name} on ${new Date(maintenanceDate).toLocaleDateString()}`;
          notifyToast({ title: 'Vehicle Maintenance Due', description: maintenanceDesc });
          addNotification({ title: 'Vehicle Maintenance Due', message: maintenanceDesc, type: 'info', url: `/trucks/${truck.id}` });
          setIsMaintenanceOpen(false);
        } catch (err) {
          // fallback to localStorage
          const rec = {
            id: `MAINT-${Date.now()}`,
            truckId: truck.id,
            type: maintenanceType,
            date: maintenanceDate,
            notes: maintenanceNotes,
            createdAt: new Date().toISOString(),
          };
          const raw = localStorage.getItem('maintenances');
          const arr = raw ? JSON.parse(raw) as any[] : [];
          arr.push(rec);
          try { localStorage.setItem('maintenances', JSON.stringify(arr)); } catch {}
          setMaintenances(arr);
          setMaintenanceType('routine');
          setMaintenanceDate('');
          setMaintenanceNotes('');
          toast.success('Maintenance scheduled locally (offline)');
          setIsMaintenanceOpen(false);
        }
      })();
    } catch (e) {
      toast.error('Failed to schedule maintenance');
    }
  };

  const handleAssignDriver = () => {
    try {
      const raw = localStorage.getItem("drivers");
      if (!raw) throw new Error("No drivers");
      const drivers = JSON.parse(raw) as Array<any>;
      const driver = drivers.find((d) => d.id === selectedDriverId);
      if (!driver) {
        toast.error("Please select a driver to assign");
        return;
      }

      // also check trips to avoid freeing drivers currently on active trips
      const tripsRaw = localStorage.getItem("trips");
      const tripsArr = tripsRaw ? JSON.parse(tripsRaw) : [];
      const hasActiveTripsForDriver = (driverId: string) => {
        try {
          return tripsArr.some((t: any) => (t.driverId === driverId || t.driver === driverId) && t.status !== "completed");
        } catch {
          return false;
        }
      };

      // assign selected driver to this truck and clear any previous driver that was assigned to this truck
      const updatedDrivers = drivers.map((d) => {
        if (d.id === driver.id) return { ...d, assignedVehicle: truck.id, status: "assigned" };
        // if some other driver was assigned to this truck, remove that assignment
        if (d.assignedVehicle === truck.id) {
          return { ...d, assignedVehicle: null, status: hasActiveTripsForDriver(d.id) ? d.status : "available" };
        }
        return d;
      });
      localStorage.setItem("drivers", JSON.stringify(updatedDrivers));
      try { window.dispatchEvent(new Event('drivers-updated')); } catch (e) {}

      // If the driver was previously assigned to another truck, free that truck
      if (driver.assignedVehicle && driver.assignedVehicle !== truck.id) {
        try {
          const prevTruck = trucks.find((t) => t.id === driver.assignedVehicle);
          if (prevTruck) updateTruck({ ...prevTruck, driver: "Unassigned", status: "available" });
        } catch (e) {
          // ignore
        }
      }

      // determine new truck status: if it's currently available, mark as assigned
      const newTruckStatus = truckData.status === "available" ? "assigned" : truckData.status;

      // update truck data via context, include driver name and new status
      updateTruck({ ...truckData, driver: driver.name, status: newTruckStatus });
      // also update local component state so UI updates immediately
      setTruckData({ ...truckData, driver: driver.name, status: newTruckStatus });

      toast.success("Driver assigned successfully");
      notifyToast({
        title: "Driver Assignment Changed",
        description: `${driver.name} has been assigned to ${truckData.name}`
      });
      addNotification({ title: "Driver Assignment Changed", message: `${driver.name} has been assigned to ${truckData.name}`, type: 'info', url: `/trucks/${truck.id}` });
      setIsAssignDriverOpen(false);
      setSelectedDriverId(null);
      setAvailableDrivers(updatedDrivers);
    } catch (e) {
      toast.error("Failed to assign driver");
    }
  };

  const handleDeleteAssignment = () => {
    try {
      const tripsRaw = localStorage.getItem("trips");
      const tripsArr = tripsRaw ? JSON.parse(tripsRaw) : [];

      const hasActiveTripsForDriver = (driverId: string) => {
        try {
          return tripsArr.some((t: any) => (t.driverId === driverId || t.driver === driverId) && t.status !== "completed");
        } catch {
          return false;
        }
      };

      // Update drivers in localStorage: remove assignedVehicle for any driver assigned to this truck
      const raw = localStorage.getItem("drivers");
      if (raw) {
        const arr = JSON.parse(raw) as any[];
        const updated = arr.map((d) =>
          d.assignedVehicle === truck.id ? { ...d, assignedVehicle: null, status: hasActiveTripsForDriver(d.id) ? d.status : "available" } : d
        );
        localStorage.setItem("drivers", JSON.stringify(updated));
        try { window.dispatchEvent(new Event('drivers-updated')); } catch (e) {}
        setAvailableDrivers(updated);
      }

      // Update the truck to be unassigned. Only mark available if no active trips for the truck.
      const hasActiveTripsForTruck = tripsArr.some((t: any) => t.truckId === truck.id && t.status !== "completed");
      const truckToUpdate = trucks.find((t) => t.id === truck.id);
      if (truckToUpdate) {
        updateTruck({ ...truckToUpdate, driver: "Unassigned", status: hasActiveTripsForTruck ? truckToUpdate.status : "available" });
      }

      setTruckData({ ...truckData, driver: "Unassigned", status: hasActiveTripsForTruck ? truckData.status : "available" });
      toast.success("Driver unassigned from vehicle");
      notifyToast({
        title: "Driver Assignment Changed",
        description: `Driver has been unassigned from ${truckData.name}`
      });
      addNotification({ title: "Driver Assignment Changed", message: `Driver has been unassigned from ${truckData.name}`, type: 'info', url: `/trucks/${truck.id}` });
      setIsAssignDriverOpen(false);
      setSelectedDriverId(null);
    } catch (e) {
      toast.error("Failed to remove driver assignment");
    }
  };

  const canAssignDriver = (status?: string) => {
    // cannot assign when truck is in these states
    return !(status === "intransit" || status === "maintenance" || status === "pending");
  };

  const handleOpenAssign = () => {
    if (!canAssignDriver(truckData.status)) {
      toast.error("Cannot assign driver to a truck that is in transit, pending, or under maintenance.");
      return;
    }
    setIsAssignDriverOpen(true);
  };

  const handleEditTrip = () => {
    toast.success("Trip details updated");
    setIsEditTripOpen(false);
  };

  const handleViewDriverProfile = () => {
    try {
      const raw = localStorage.getItem("drivers");
      if (!raw) {
        toast.error("No drivers found");
        return;
      }
      const drivers = JSON.parse(raw) as Array<any>;
      const found = drivers.find((d) => d.assignedVehicle === truck.id || d.name === truck.driver);
      if (found) {
        navigate(`/drivers/${found.id}`);
      } else {
        toast.error("No driver profile found for this vehicle");
      }
    } catch (e) {
      toast.error("Unable to open driver profile");
    }
  };

  const handleSaveTruckEdit = () => {
    // Validate plate number format ABC-1234
    const plateRegex = /^[A-Z]{3}-\d{4}$/;
    // create a final copy of the truck data and enforce 'assigned' when a driver is present
    const finalTruckData = { ...truckData } as TruckType;
    if (finalTruckData.driver && finalTruckData.driver !== "Unassigned") {
      finalTruckData.status = "assigned" as TruckType["status"];
    }

    // Validate required fields: Name, Plate, Model, Capacity
    try {
      const missing: string[] = [];
      if (!finalTruckData.name || String(finalTruckData.name).trim() === "") missing.push("Name");
      if (!finalTruckData.plateNumber || String(finalTruckData.plateNumber).trim() === "") missing.push("Plate number");
      if (!finalTruckData.model || String(finalTruckData.model).trim() === "") missing.push("Model");
      if (finalTruckData.loadCapacity === undefined || finalTruckData.loadCapacity === null || finalTruckData.loadCapacity === "" || isNaN(Number(finalTruckData.loadCapacity))) missing.push("Capacity");
      if (missing.length > 0) {
        toast.error(`Please fill required field${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`);
        return;
      }
    } catch (e) {
      // fallback: if validation fails unexpectedly, prevent save
      toast.error('Please complete all required fields');
      return;
    }

    if (!plateRegex.test(finalTruckData.plateNumber)) {
      toast.error("Plate number must be in format ABC-1234");
      return;
    }

    // Prevent setting In Transit without an assigned driver
    if (finalTruckData.status === "intransit" && (!finalTruckData.driver || finalTruckData.driver === "" || finalTruckData.driver === "Unassigned")) {
      toast.error("Cannot mark 'In Transit' without an assigned driver");
      return;
    }
    // Prevent setting Available while driver is assigned
    if (finalTruckData.status === "available" && finalTruckData.driver && finalTruckData.driver !== "Unassigned") {
      toast.error("Cannot mark 'Available' while a driver is assigned");
      return;
    }
    // Prevent setting Maintenance while driver is assigned
    if (finalTruckData.status === "maintenance" && finalTruckData.driver && finalTruckData.driver !== "Unassigned") {
      toast.error("Cannot mark 'Maintenance' while a driver is assigned");
      return;
    }

    // update through context so list updates immediately
    try {
      updateTruck({ ...finalTruckData });
      // sync driver status in localStorage when truck status changes
      try {
        const rawDrivers = localStorage.getItem("drivers");
        if (rawDrivers) {
          const arr = JSON.parse(rawDrivers) as any[];
          const hasCompletedTripForTruck = (truckId: string) => {
            try {
              const tRaw = localStorage.getItem('trips');
              if (!tRaw) return false;
              const tArr = JSON.parse(tRaw) as any[];
              return tArr.some((tr) => String(tr.truckId) === String(truckId) && tr.status === 'completed');
            } catch (e) {
              return false;
            }
          };

          const updatedDrivers = arr.map((d) => {
            // match by assignedVehicle or name
            const isAssigned = d.assignedVehicle === finalTruckData.id;
            const nameMatches = d.name === finalTruckData.driver;
            if (finalTruckData.status === "intransit" && (isAssigned || nameMatches)) {
              return { ...d, status: "driving", assignedVehicle: finalTruckData.id };
            }
            // truck not intransit: if driver is still assigned to this truck, mark as assigned
            if (!finalTruckData || finalTruckData.status !== "intransit") {
              if (isAssigned) {
                return { ...d, status: "assigned", assignedVehicle: finalTruckData.id };
              }
              if (nameMatches && d.status === "driving" && d.assignedVehicle !== finalTruckData.id) {
                // preserve assignment if a completed trip exists for this truck
                if (hasCompletedTripForTruck(finalTruckData.id)) return d;
                return { ...d, status: "available" };
              }
            }
            return d;
          });
          localStorage.setItem("drivers", JSON.stringify(updatedDrivers));
        }
      } catch (e) {
        // ignore
      }
    } catch (err) {
      // If context not available, fall back to localStorage
      try {
        const raw = localStorage.getItem("trucks");
        if (raw) {
          const arr = JSON.parse(raw) as TruckType[];
          const updated = arr.map((t) => (t.id === finalTruckData.id ? { ...t, ...finalTruckData } : t));
          localStorage.setItem("trucks", JSON.stringify(updated));
          // also update drivers to keep statuses in sync when falling back
          try {
            const rawDrivers = localStorage.getItem("drivers");
            if (rawDrivers) {
              const darr = JSON.parse(rawDrivers) as any[];
              const updatedDrivers = darr.map((d) => {
                const isAssigned = d.assignedVehicle === finalTruckData.id || d.name === finalTruckData.driver;
                if (isAssigned) {
                  if (finalTruckData.status === "intransit") {
                    return { ...d, status: "driving", assignedVehicle: finalTruckData.id };
                  }
                  if (d.status === "driving") {
                    return { ...d, status: "available" };
                  }
                }
                return d;
              });
              localStorage.setItem("drivers", JSON.stringify(updatedDrivers));
            }
          } catch (e) {
            // ignore
          }
        }
      } catch (e) {
        // ignore
      }
    }

    toast.success(`Truck ${truckData.name} updated successfully`);
    setIsEditTruckOpen(false);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
      available: { color: "bg-green-100 text-green-800 hover:bg-green-200", label: "Available", icon: <User className="h-3 w-3 mr-1" /> },
      pending: { color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200", label: "Pending", icon: null },
      assigned: { color: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200", label: "Assigned", icon: <Truck className="h-3 w-3 mr-1" /> },
      intransit: { color: "bg-blue-100 text-blue-800 hover:bg-blue-200", label: "In Transit", icon: <Truck className="h-3 w-3 mr-1" /> },
      maintenance: { color: "bg-amber-100 text-amber-800 hover:bg-amber-200", label: "Maintenance", icon: null },
      driving: { color: "bg-blue-100 text-blue-800 hover:bg-blue-200", label: "Driving", icon: <Truck className="h-3 w-3 mr-1" /> },
      "off-duty": { color: "bg-amber-100 text-amber-800 hover:bg-amber-200", label: "Off Duty", icon: null },
      inactive: { color: "bg-slate-100 text-slate-800 hover:bg-slate-200", label: "Inactive", icon: null },
    };
    const displayStatus = status;
    const config = statusConfig[displayStatus] || statusConfig.pending;
    return (
      <Badge variant="outline" className={`${config.color} border-none flex items-center px-3 py-1 text-sm`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const formatPlate = (raw: string) => {
    const letters = (raw.match(/[A-Za-z]/g) || []).join("").slice(0, 3).toUpperCase();
    const digits = (raw.match(/\d/g) || []).join("").slice(0, 4);
    if (letters && digits) return `${letters}-${digits}`;
    if (letters) return letters;
    if (digits) return digits;
    return "";
  };

  const computeTripMetrics = (trip: any) => {
    try {
      const toRad = (v: number) => (v * Math.PI) / 180;
      const oLat = trip.originLat ?? trip.origin?.lat;
      const oLng = trip.originLng ?? trip.origin?.lng;
      const dLat = trip.destLat ?? trip.destination?.lat;
      const dLng = trip.destLng ?? trip.destination?.lng;

      // prefer geocoords when available
      if (
        typeof oLat === 'number' &&
        typeof oLng === 'number' &&
        typeof dLat === 'number' &&
        typeof dLng === 'number'
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
        const routingFactor = 1.3;
        const roadDistanceKm = distanceKm * routingFactor;
        const avgSpeedKmh = 60;
        const durationHours = roadDistanceKm / avgSpeedKmh;
        return { distanceKm: roadDistanceKm, durationSeconds: Math.round(durationHours * 3600) };
      }

      // fallback: if stored distance exists (assume miles) convert to km
      const rawDist = trip.distance ?? trip.miles;
      if (rawDist !== undefined && rawDist !== null) {
        const num = typeof rawDist === 'number' ? rawDist : parseFloat(String(rawDist).replace(/[^0-9.\-]/g, ''));
        if (!isNaN(num)) {
          const km = num * 1.60934;
          // estimate duration using avg speed
          const avgSpeedKmh = 60;
          const durationHours = km / avgSpeedKmh;
          return { distanceKm: km, durationSeconds: Math.round(durationHours * 3600) };
        }
      }

      // fallback: if start/end times exist compute duration and leave distance blank
      if (trip.startTime && trip.endTime) {
        const start = new Date(trip.startTime).getTime();
        const end = new Date(trip.endTime).getTime();
        if (!isNaN(start) && !isNaN(end) && end > start) {
          return { distanceKm: undefined, durationSeconds: Math.max(0, Math.round((end - start) / 1000)) };
        }
      }

      return { distanceKm: undefined, durationSeconds: undefined };
    } catch (e) {
      return { distanceKm: undefined, durationSeconds: undefined };
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="space-y-1 flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold">{truckData.name}</h2>
                {getStatusBadge(truckData.status)}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  <span>ID: {truckData.id}</span>
                </div>
                <div className="flex items-center">
                  <Truck className="h-4 w-4 mr-2" />
                  <span>Plate: {truckData.plateNumber ?? '-'}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
              <Button variant="outline" className="gap-2" onClick={() => handleEditOpenChange(true)}>
                <Edit2 className="h-4 w-4" />
                <span>Edit Truck</span>
              </Button>
              <Button className="gap-2" onClick={handleOpenAssign} disabled={!canAssignDriver(truckData.status)}>
                <UserPlus className="h-4 w-4" />
                <span>Assign Driver</span>
              </Button>
            </div>
          </div>
          {/* driver summary removed from header per UX request */}
        </CardContent>
      </Card>
      
      <Tabs defaultValue="info" className="space-y-4 mt-4">
        <TabsList>
          <TabsTrigger value="info">Vehicle Information</TabsTrigger>
          <TabsTrigger value="maintenance">Scheduled Maintenance</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="history">Trip History</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 items-stretch">
            <InfoCard title="Vehicle Information" icon={<Truck className="h-5 w-5" />}>
              <dl className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <dt>Name</dt>
                  <dd className="font-medium">{truckData.name || truck.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Plate Number</dt>
                  <dd className="font-medium">{truckData.plateNumber || truck.plateNumber || "-"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Model</dt>
                  <dd className="font-medium">{truckData.model || truck.model || "-"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Capacity</dt>
                  <dd className="font-medium">{truckData.loadCapacity !== undefined && truckData.loadCapacity !== null ? String(truckData.loadCapacity) : (truck.loadCapacity !== undefined ? String(truck.loadCapacity) : "-")}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Fuel Type</dt>
                  <dd className="font-medium">{truckData.fuelType || truck.fuelType || "-"}</dd>
                </div>
                <div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <dt>Fuel Level</dt>
                    <dd className="font-medium">{truckData.fuelLevel ?? truck.fuelLevel ?? "-"}%</dd>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-1 overflow-hidden">
                    <div
                      className={`h-full ${
                        (truckData.fuelLevel ?? truck.fuelLevel ?? 0) > 70
                          ? "bg-status-available"
                          : (truckData.fuelLevel ?? truck.fuelLevel ?? 0) > 30
                          ? "bg-status-pending"
                          : "bg-status-maintenance"
                      }`}
                      style={{ width: `${truckData.fuelLevel ?? truck.fuelLevel ?? 0}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between">
                  <dt>Status</dt>
                  <dd className="font-medium">{truckData.status || truck.status}</dd>
                </div>
              </dl>
            </InfoCard>

            <InfoCard title="Driver Information" icon={<User className="h-5 w-5" />}>
              {(() => {
                const driverEmpty = truckData.status === "available" || !truckData.driver || truckData.driver === "Unassigned";
                if (driverEmpty) {
                  return (
                    <div className="text-sm text-muted-foreground italic">No driver currently assigned to this truck.</div>
                  );
                }

                const d = driverProfile;
                const formatDate = (s?: string) => {
                  try {
                    if (!s) return "-";
                    return format(new Date(s), "MMMM do, yyyy");
                  } catch (e) {
                    return s || "-";
                  }
                };

                return (
                  <dl className="space-y-4">
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-muted-foreground">Full Name</dt>
                      <dd className="text-sm font-semibold">{d?.name || truckData.driver || "-"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
                      <dd className="text-sm font-semibold">{d?.phone ?? "-"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                      <dd className="text-sm font-semibold">{d?.email ?? "-"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-muted-foreground">License Number</dt>
                      <dd className="text-sm font-semibold">{d?.licenseNumber ?? "-"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-muted-foreground">License Type</dt>
                      <dd className="text-sm font-semibold">{(() => {
                        const t = d?.licenseType;
                        if (!t) return "Commercial (Class A)";
                        if (t === "commercial-a") return "Commercial (Class A)";
                        if (t === "commercial-b") return "Commercial (Class B)";
                        if (t === "non-commercial") return "Non-Commercial";
                        return t;
                      })()}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-muted-foreground">License Exp</dt>
                      <dd className="text-sm font-semibold">{formatDate(d?.licenseExpiry)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-muted-foreground">Date of Birth</dt>
                      <dd className="text-sm font-semibold">{formatDate(d?.dateOfBirth)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-muted-foreground">Address</dt>
                      <dd className="text-sm font-semibold text-right">{d?.address ?? "-"}</dd>
                    </div>

                    <div className="mt-2 flex items-center w-full">
                      <div>
                        <Button variant="outline" size="sm" onClick={handleViewDriverProfile}>
                          View Driver Profile
                        </Button>
                      </div>
                      <div className="ml-auto">
                        <Button
                          variant="destructive"
                          className="bg-rose-600 text-white hover:bg-rose-700"
                          size="sm"
                          onClick={handleDeleteAssignment}
                          disabled={isUnassignBlocked}
                          title={isUnassignBlocked ? 'Cannot unassign while In Transit or Pending' : 'Unassign driver'}
                        >
                          Unassign
                        </Button>
                      </div>
                    </div>
                  </dl>
                );
              })()}
            </InfoCard>
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Maintenance</CardTitle>
              <CardDescription>Upcoming maintenance for this vehicle</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const upcoming = maintenances
                  .filter((m) => String(m.truckId) === String(truck.id))
                  .map((m) => ({ ...m, dateObj: new Date(m.date) }))
                  .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
                if (!upcoming || upcoming.length === 0) return <div className="text-sm italic text-muted-foreground">No maintenance scheduled.</div>;
                return (
                  <ul className="text-sm space-y-2">
                    {upcoming.map((m) => (
                      <li key={m.id} className="border rounded p-2">
                        <div className="font-medium text-base">{m.type ? m.type.replace(/-/g, ' ') : '-'}</div>

                        <div className="text-sm text-muted-foreground mt-2">Date</div>
                        <div className="font-medium">{m.date ? format(new Date(m.date), 'MM/dd/yyyy') : '-'}</div>

                        <div className="text-sm text-muted-foreground mt-2">Notes</div>
                        <div className="font-medium">{m.notes ? m.notes : '-'}</div>
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </CardContent>
            <div className="p-4">
              <Button variant="outline" onClick={() => setIsMaintenanceOpen(true)}>Schedule Maintenance</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
            {/* Upcoming Trips card removed per request */}

          <Card>
            <CardHeader>
              <CardTitle>Weekly Schedule</CardTitle>
              <CardDescription>Vehicle availability and usage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {(() => {
                  // build next 7 days starting today
                  const days: Date[] = [];
                  const now = new Date();
                  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                  for (let i = 0; i < 7; i++) {
                    const d = new Date(start);
                    d.setDate(start.getDate() + i);
                    days.push(d);
                  }

                  // use schedules loaded by effect, fallback to local trips in state
                  let tripsForTruck: any[] = [];
                  try {
                    tripsForTruck = schedules.filter((s) => String(s.truckId) === String(truck.id));
                    if (!tripsForTruck || tripsForTruck.length === 0) {
                      const raw = localStorage.getItem('trips');
                      const all = raw ? (JSON.parse(raw) as any[]) : [];
                      tripsForTruck = all.filter((t) => String(t.truckId) === String(truck.id));
                    }
                  } catch (e) {
                    tripsForTruck = [];
                  }

                  const formatDay = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'short' });
                  const formatShort = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

                  return days.map((day) => {
                    const dayTrips = tripsForTruck.filter((t) => {
                      try {
                        const ts = t.startTime || t.departureDate || t.date || t.departure || t.createdAt;
                        if (!ts) return false;
                        const dt = new Date(ts);
                        return dt.getFullYear() === day.getFullYear() && dt.getMonth() === day.getMonth() && dt.getDate() === day.getDate();
                      } catch (e) {
                        return false;
                      }
                    });

                    return (
                      <div key={day.toISOString()} className="text-center">
                        <div className="mb-2 font-medium">{formatDay(day)}</div>
                        {dayTrips.length > 0 ? (
                          <div className="rounded-md p-2 text-xs font-medium bg-green-100 text-green-800">
                            <div className="font-semibold">{dayTrips.length} trip{dayTrips.length > 1 ? 's' : ''}</div>
                            <div className="text-xs text-muted-foreground">{formatShort(day)}</div>
                            <div className="mt-1 text-xs truncate">{(dayTrips[0].destination || dayTrips[0].dest || dayTrips[0].route || '').toString()}</div>
                          </div>
                        ) : (
                          <div className="rounded-md p-2 text-xs font-medium bg-slate-100 text-slate-800">No trips</div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
                <CardHeader>
                  <CardTitle>Trip History</CardTitle>
                  <CardDescription>Recent trips completed by this vehicle</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {(() => {
                      const completedTrips = tripHistories
                        .filter((t) => String(t.truckId) === String(truck.id) && (t.status === "completed" || t.status === "done"))
                        .sort((a, b) => {
                          const da = new Date(a.endTime || a.arrivedAt || a.archived_at || 0).getTime();
                          const db = new Date(b.endTime || b.arrivedAt || b.archived_at || 0).getTime();
                          return db - da;
                        });

                      if (!completedTrips || completedTrips.length === 0) {
                        return <div className="text-sm italic text-muted-foreground">No completed trips for this vehicle.</div>;
                      }

                      return completedTrips.map((trip, i) => (
                        <div key={trip.id || i} className="border-b pb-6 last:border-0 last:pb-0">
                          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold">Route #{trip.routeNumber ?? trip.id ?? (2000 + i)}</h3>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(trip.arrivalDate || trip.endTime || trip.departureDate || trip.createdAt || Date.now()), "PPP")}
                              </div>
                            </div>
                            <Badge className="mt-2 md:mt-0 w-fit" variant="outline">Completed</Badge>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <div className="text-sm text-muted-foreground">Origin</div>
                              <div className="flex items-start gap-2">
                                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-medium">{trip.origin || trip.from || trip.pickup || 'Unknown'}</div>
                                  <div className="text-xs text-muted-foreground">Departed: {trip.departureDate ? format(new Date(trip.departureDate), "PPP") : (trip.startTime ? format(new Date(trip.startTime), "PPP") : '—')}</div>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="text-sm text-muted-foreground">Destination</div>
                              <div className="flex items-start gap-2">
                                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-medium">{trip.destination || trip.to || trip.dest || 'Unknown'}</div>
                                  <div className="text-xs text-muted-foreground">Arrived: {trip.arrivalDate ? format(new Date(trip.arrivalDate), "PPP") : (trip.endTime ? format(new Date(trip.endTime), "PPP") : '—')}</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-3">
                            {(() => {
                              const metrics = computeTripMetrics(trip);
                              const distanceText = typeof metrics.distanceKm === 'number' ? `${metrics.distanceKm.toFixed(2)} km` : '—';
                              const durationText = (() => {
                                const s = metrics.durationSeconds;
                                if (!s && s !== 0) return '—';
                                const hrs = Math.floor(s / 3600);
                                const mins = Math.round((s % 3600) / 60);
                                if (hrs > 0) return `${hrs}h ${mins}m`;
                                return `${mins}m`;
                              })();
                              return (
                                <>
                                  <div className="text-xs bg-muted px-2 py-1 rounded-md">Distance: {distanceText}</div>
                                  <div className="text-xs bg-muted px-2 py-1 rounded-md">Duration: {durationText}</div>
                                </>
                              );
                            })()}
                            <div className="text-xs bg-muted px-2 py-1 rounded-md">Cargo: {trip.cargo ?? trip.cargoType ?? '—'}</div>
                            <div className="text-xs bg-muted px-2 py-1 rounded-md">Driver: {trip.driver || trip.driverName || trip.driverId || '—'}</div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Documents</CardTitle>
              <CardDescription>Registration, insurance, and other documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <DocumentItem title="Registration" number={truck.plateNumber || 'N/A'} issueDate={new Date(2022,0,1)} expiryDate={new Date(2026,0,1)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* Tracking Map Dialog */}
      <Dialog open={isTrackingOpen} onOpenChange={setIsTrackingOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Track Location</DialogTitle>
            <DialogDescription>Real-time location for {truck.name}</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <TrackingMap />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTrackingOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Maintenance Dialog */}
      <Dialog open={isMaintenanceOpen} onOpenChange={setIsMaintenanceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Maintenance</DialogTitle>
            <DialogDescription>Schedule maintenance for {truck.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="maintenance-type">Maintenance Type</Label>
              <Select value={maintenanceType} onValueChange={(v) => setMaintenanceType(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine Check</SelectItem>
                  <SelectItem value="oil">Oil Change</SelectItem>
                  <SelectItem value="tire">Tire Replacement</SelectItem>
                  <SelectItem value="brake">Brake Service</SelectItem>
                  <SelectItem value="full">Full Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maintenance-date">Date</Label>
              <Input id="maintenance-date" type="date" value={maintenanceDate} onChange={(e) => setMaintenanceDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maintenance-notes">Notes</Label>
              <Input id="maintenance-notes" value={maintenanceNotes} onChange={(e) => setMaintenanceNotes(e.target.value)} placeholder="Additional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMaintenanceOpen(false)}>Cancel</Button>
            <Button onClick={handleScheduleMaintenance}>Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Driver Dialog */}
      <Dialog open={isAssignDriverOpen} onOpenChange={setIsAssignDriverOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Driver</DialogTitle>
            <DialogDescription>Assign a driver to {truck.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="driver">Select Driver</Label>
              <Select value={selectedDriverId || undefined} onValueChange={(v) => setSelectedDriverId(v || null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a driver" />
                </SelectTrigger>
                <SelectContent>
                  {assignableDrivers.length === 0 ? (
                    <SelectItem value="__none" disabled>No available drivers</SelectItem>
                  ) : (
                    assignableDrivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name} {d.assignedVehicle ? `(Assigned: ${d.assignedVehicle})` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignDriverOpen(false)}>Cancel</Button>
              <Button variant="default" className="gap-2" onClick={handleAssignDriver} disabled={!canAssignDriver(truckData.status) || !selectedDriverId}>
                Assign
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Trip Dialog */}
      <Dialog open={isEditTripOpen} onOpenChange={setIsEditTripOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Trip Details</DialogTitle>
            <DialogDescription>Update trip information for {truck.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="origin">Origin</Label>
              <Input id="origin" defaultValue="San Francisco, CA" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">Destination</Label>
              <Input id="destination" defaultValue="Los Angeles, CA" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo Type</Label>
              <Input id="cargo" defaultValue="Electronics" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditTripOpen(false)}>Cancel</Button>
            <Button onClick={handleEditTrip}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Truck Dialog */}
      <Dialog open={isEditTruckOpen} onOpenChange={handleEditOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Truck</DialogTitle>
            <DialogDescription>Update truck details for {truckData.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleSaveTruckEdit(); }}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="truck-name" className="text-right">Name</Label>
                <Input id="truck-name" name="name" value={truckData.name} onChange={(e) => setTruckData({ ...truckData, name: e.target.value })} className="col-span-3" required />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="truck-plate" className="text-right">Plate Number</Label>
                <Input id="truck-plate" name="plateNumber" value={truckData.plateNumber} onChange={(e) => setTruckData({ ...truckData, plateNumber: formatPlate(e.target.value) })} placeholder="ABC-1234" pattern="[A-Z]{3}-[0-9]{4}" className="col-span-3" required />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="truck-model" className="text-right">Model</Label>
                <Input id="truck-model" name="model" value={truckData.model} onChange={(e) => setTruckData({ ...truckData, model: e.target.value })} className="col-span-3" required />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="truck-capacity" className="text-right">Capacity</Label>
                <Input id="truck-capacity" name="loadCapacity" type="number" step="0.1" placeholder="ton/s" value={truckData.loadCapacity !== undefined && truckData.loadCapacity !== null ? String(truckData.loadCapacity) : ''} onChange={(e) => { const v = e.target.value; setTruckData({ ...truckData, loadCapacity: v === '' ? undefined : Number(v) }); }} className="col-span-3" required />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="truck-fuelType" className="text-right">Fuel Type</Label>
                <Select value={truckData.fuelType || "Diesel"} onValueChange={(v) => setTruckData({ ...truckData, fuelType: v })}>
                  <SelectTrigger className="col-span-3"><SelectValue placeholder="Select fuel type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Diesel">Diesel</SelectItem>
                    <SelectItem value="Petrol">Petrol</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="truck-fuelLevel" className="text-right">Fuel Level</Label>
                <div className="col-span-3">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Slider value={[Number(truckData.fuelLevel ?? truck.fuelLevel ?? 0)]} onValueChange={(val) => setTruckData({ ...truckData, fuelLevel: Number(val[0]) })} min={0} max={100} step={1} />
                    </div>
                    <div className="w-14 text-right text-sm font-medium">{truckData.fuelLevel ?? truck.fuelLevel}%</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="truck-status" className="text-right">Status</Label>
                {truckData.driver && truckData.driver !== "Unassigned" ? (
                  <div className="col-span-3">
                    <div className="px-3 py-2 w-full border rounded bg-muted text-muted-foreground">Assigned</div>
                  </div>
                ) : truckData.status === 'intransit' ? (
                  <div className="col-span-3">
                    <div className="px-3 py-2 w-full border rounded bg-muted text-muted-foreground">In Transit</div>
                  </div>
                ) : (
                  <Select value={truckData.status} onValueChange={(value) => setTruckData({ ...truckData, status: value as TruckType["status"] })}>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditTruckOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTruckEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

interface InfoCardProps {
  title: string;
  icon: React.ReactNode;
  items?: { label: string; value: string }[];
  children?: React.ReactNode;
}

const InfoCard: React.FC<InfoCardProps> = ({
  title,
  icon,
  items,
  children,
}) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            {icon}
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2">
          {items?.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <dt className="text-muted-foreground">{item.label}:</dt>
              <dd className="font-medium">{item.value}</dd>
            </div>
          ))}
        </dl>
        {children}
      </CardContent>
    </Card>
  );
};

export default TruckDetails;
