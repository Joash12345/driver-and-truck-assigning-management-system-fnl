import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  Edit,
  Edit2,
  FileText,
  Mail,
  MapPin,
  Phone,
  Truck,
  User,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatLicense, formatPhoneFromAny, formatPhoneFromSuffix, extractPhoneSuffix } from "@/lib/utils";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { DriverType } from "@/pages/Drivers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useTruckContext } from "@/context/TruckContext";
import { toast } from "sonner";

interface DriverDetailsProps {
  driver: DriverType;
  setDrivers?: React.Dispatch<React.SetStateAction<DriverType[]>>;
}

const DriverDetails: React.FC<DriverDetailsProps> = ({ driver, setDrivers }) => {
  const navigate = useNavigate();
  const { trucks, updateTruck } = useTruckContext();

  const availableVehicles = Array.isArray(trucks)
    ? trucks.filter((t) =>
        t.status === "available" || (t.status === "assigned" && (!t.driver || t.driver === "Unassigned"))
      )
    : [];

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState<any>(driver);
  const [editAddress, setEditAddress] = useState<string | undefined>(driver.address);
  const [editAddressCoords, setEditAddressCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isAddressPickerOpen, setIsAddressPickerOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedTruckId, setSelectedTruckId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info'|'schedule'|'history'|'documents'>('info');

  const canAssignVehicle = (status?: string) => {
    // cannot assign when driver is driving, off-duty, or inactive
    return !(status === "driving" || status === "off-duty" || status === "inactive" || status === "pending");
  };

  const handleOpenAssign = () => {
    if (!canAssignVehicle(driver.status)) {
      toast.error("Cannot assign a vehicle while driver is driving, off-duty, or inactive.");
      return;
    }
    setIsAssignOpen(true);
  };

  useEffect(() => {
    // reflect assigned status when opening editor
    setEditData({ ...driver, status: driver.assignedVehicle ? "assigned" : driver.status });
    setSelectedTruckId(driver.assignedVehicle);
    setEditAddress((driver as any).address ?? "");
    setEditAddressCoords(null);
  }, [driver]);

  // NOTE: removed automatic 'Quinn' correction to preserve user-entered values

  const assignedTruck = driver.assignedVehicle ? trucks.find((t) => t.id === driver.assignedVehicle) : undefined;

  // block unassign when either the truck or driver is pending/intransit
  const isUnassignBlocked = (assignedTruck?.status === 'intransit') || (assignedTruck?.status === 'pending') || (driver.status === 'pending');

  const handleSaveEdit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // enforce assigned when driver has an assigned vehicle
    const finalEdit = { ...(editData || {}) } as DriverType;
    if (finalEdit.assignedVehicle) finalEdit.status = "assigned";

    // Prevent setting to off-duty/inactive if driver has an assigned vehicle
    if (finalEdit?.assignedVehicle && (finalEdit.status === "off-duty" || finalEdit.status === "inactive")) {
      toast.error("Cannot set driver to Off Duty or Inactive while a vehicle is assigned.");
      return;
    }

    // persist change locally
    if (setDrivers) {
      setDrivers((prev) => prev.map((d) => (d.id === driver.id ? { ...d, ...finalEdit } : d)));
    } else {
      try {
        const raw = localStorage.getItem("drivers");
        if (raw) {
          const arr = JSON.parse(raw);
          const updated = arr.map((d: any) => (d.id === driver.id ? { ...d, ...finalEdit } : d));
          localStorage.setItem("drivers", JSON.stringify(updated));
        }
      } catch (e) {
        // ignore
      }
    }

    // Best-effort: persist to backend
    try {
      await apiFetch(`/api/drivers/${driver.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: finalEdit.name,
          license_number: finalEdit.licenseNumber,
          email: finalEdit.email,
          phone: finalEdit.phone,
          status: finalEdit.status,
          license_type: finalEdit.licenseType,
          license_expiry: finalEdit.licenseExpiry,
          date_of_birth: finalEdit.dateOfBirth,
          address: finalEdit.address,
          assigned_vehicle: finalEdit.assignedVehicle,
        }),
      });
    } catch (e) {
      // ignore network errors
    }

    toast.success("Driver updated successfully");
    setIsEditOpen(false);
  };
  
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { color: string; label: string; icon: React.ReactNode }
    > = {
      available: {
        color: "bg-green-100 text-green-800 hover:bg-green-200",
        label: "Available",
        icon: <User className="h-3 w-3 mr-1" />,
      },
      pending: {
        color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
        label: "Pending",
        icon: null,
      },
      assigned: {
        color: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200",
        label: "Assigned",
        icon: <Truck className="h-3 w-3 mr-1" />,
      },
      driving: {
        color: "bg-blue-100 text-blue-800 hover:bg-blue-200",
        label: "Driving",
        icon: <Truck className="h-3 w-3 mr-1" />,
      },
      "off-duty": {
        color: "bg-amber-100 text-amber-800 hover:bg-amber-200",
        label: "Off Duty",
        icon: null,
      },
      inactive: {
        color: "bg-slate-100 text-slate-800 hover:bg-slate-200",
        label: "Inactive",
        icon: null,
      },
    };

    // For display purposes treat legacy/placeholder 'inactive' drivers as 'pending'
    const displayStatus = status === "inactive" ? "pending" : status;
    const config = statusConfig[displayStatus] || statusConfig.pending;

    return (
      <Badge
        variant="outline"
        className={`${config.color} border-none flex items-center px-3 py-1 text-sm`}
      >
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const computeTripMetrics = (trip: any) => {
    try {
      const toRad = (v: number) => (v * Math.PI) / 180;
      const oLat = trip.originLat ?? trip.origin?.lat;
      const oLng = trip.originLng ?? trip.origin?.lng;
      const dLat = trip.destLat ?? trip.destination?.lat;
      const dLng = trip.destLng ?? trip.destination?.lng;

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

      const rawDist = trip.distance ?? trip.miles;
      if (rawDist !== undefined && rawDist !== null) {
        const num = typeof rawDist === 'number' ? rawDist : parseFloat(String(rawDist).replace(/[^0-9.\-]/g, ''));
        if (!isNaN(num)) {
          const km = num * 1.60934;
          const avgSpeedKmh = 60;
          const durationHours = km / avgSpeedKmh;
          return { distanceKm: km, durationSeconds: Math.round(durationHours * 3600) };
        }
      }

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

  const handleRemoveVehicle = () => {
    const removedTruckId = driver.assignedVehicle;
    if (!removedTruckId) {
      toast.error("No vehicle assigned to remove.");
      return;
    }

    // prevent unassigning if the assigned truck is currently in transit
    try {
      const truckObj = trucks.find((t) => t.id === removedTruckId);
      if (truckObj && truckObj.status === 'intransit') {
        toast.error('Cannot unassign vehicle while it is In Transit.');
        return;
      }
    } catch (e) {
      // ignore and continue
    }

    try {
      // Remove assignment from any drivers that reference this truck.
      const tripsRaw = localStorage.getItem("trips");
      const tripsArr = tripsRaw ? JSON.parse(tripsRaw) : [];

      const hasActiveTripsForDriver = (driverId: string) => {
        try {
          return tripsArr.some((t: any) => (t.driverId === driverId || t.driver === driverId) && t.status !== "completed");
        } catch {
          return false;
        }
      };

      if (setDrivers) {
        setDrivers((prev) => prev.map((d) => d.assignedVehicle === removedTruckId ? { ...d, assignedVehicle: null, status: hasActiveTripsForDriver(d.id) ? d.status : "available" } : d));
      } else {
        const raw = localStorage.getItem("drivers");
        if (raw) {
          const arr = JSON.parse(raw);
          const updated = arr.map((d: any) => d.assignedVehicle === removedTruckId ? { ...d, assignedVehicle: null, status: hasActiveTripsForDriver(d.id) ? d.status : "available" } : d);
          localStorage.setItem("drivers", JSON.stringify(updated));
        }
      }

      // Update the truck to be unassigned (if present).
      // Only mark the truck "available" if it has no active trips.
      const truckToRemove = trucks.find((t) => t.id === removedTruckId);
      if (truckToRemove) {
        const hasActiveTripsForTruck = tripsArr.some((t: any) => t.truckId === removedTruckId && t.status !== "completed");
        updateTruck({ ...truckToRemove, driver: "Unassigned", status: hasActiveTripsForTruck ? truckToRemove.status : "available" });
      }

      toast.success("Vehicle removed from driver");
      setIsAssignOpen(false);
      setSelectedTruckId(null);
    } catch (e) {
      toast.error("Failed to remove vehicle assignment");
    }
  };

  

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* left spacer removed to align header with tab content */}
            <div className="space-y-1 flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold">{driver.name}</h2>
                {getStatusBadge(driver.status)}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  <span>ID: {driver.id}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>{driver.phone}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>{driver.email}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Edit2 className="h-4 w-4" />
                    <span>Edit Profile</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <form onSubmit={handleSaveEdit}>
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                      <DialogDescription>Update driver details for {driver.name}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-name" className="text-right">Full Name</Label>
                        <Input id="edit-name" value={editData.name ?? ""} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="col-span-3" required />
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-dob" className="text-right">Date of Birth</Label>
                        <Input id="edit-dob" name="dateOfBirth" type="date" value={editData.dateOfBirth ?? ""} onChange={(e) => setEditData({ ...editData, dateOfBirth: e.target.value })} className="col-span-3" />
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-licenseNumber" className="text-right">License</Label>
                        <Input
                          id="edit-licenseNumber"
                          name="licenseNumber"
                          value={editData.licenseNumber ?? ""}
                          onChange={(e) => setEditData({ ...editData, licenseNumber: formatLicense(e.target.value) })}
                          className="col-span-3"
                          required
                          inputMode="numeric"
                          pattern="^\d{4}-\d{3}-\d{5}$"
                          onKeyDown={(e) => {
                            const allowed = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End"];
                            if (allowed.includes(e.key)) return;
                            if (!/^[0-9]$/.test(e.key)) {
                              e.preventDefault();
                              return;
                            }
                            const currentDigits = ((editData?.licenseNumber as string) || "").replace(/\D/g, "").length;
                            if (currentDigits >= 12) e.preventDefault();
                          }}
                          onPaste={(e: any) => {
                            const paste = e.clipboardData.getData("Text") || "";
                            const digits = paste.replace(/\D/g, "").slice(0, 12);
                            e.preventDefault();
                            setEditData({ ...editData, licenseNumber: formatLicense(digits) });
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-licenseType" className="text-right">License Type</Label>
                        <Select value={editData.licenseType ?? "commercial-a"} onValueChange={(v) => setEditData({ ...editData, licenseType: v })}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select license type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="commercial-a">Commercial (Class A)</SelectItem>
                            <SelectItem value="commercial-b">Commercial (Class B)</SelectItem>
                            <SelectItem value="non-commercial">Non-Commercial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-licenseExpiry" className="text-right">License Exp</Label>
                        <Input id="edit-licenseExpiry" name="licenseExpiry" type="date" value={editData.licenseExpiry ?? ""} onChange={(e) => setEditData({ ...editData, licenseExpiry: e.target.value })} className="col-span-3" />
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-email" className="text-right">Email</Label>
                        <Input id="edit-email" name="email" type="email" value={editData.email ?? ""} onChange={(e) => setEditData({ ...editData, email: e.target.value })} placeholder="Enter email address" className="col-span-3" />
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-phone" className="text-right">Phone</Label>
                        <Input
                          id="edit-phone"
                          name="phone"
                          placeholder="+63-9XX-XXX-YYYY"
                          className="col-span-3"
                          value={formatPhoneFromAny(editData.phone)}
                          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                            const allowed = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End"];
                            if (allowed.includes(e.key)) {
                              if (e.key === "Backspace") {
                                const cur = extractPhoneSuffix(editData.phone || "");
                                setEditData({ ...editData, phone: formatPhoneFromSuffix(cur.slice(0, -1)) });
                              }
                              return;
                            }
                            if (!/^[0-9]$/.test(e.key)) {
                              e.preventDefault();
                              return;
                            }
                            const cur = extractPhoneSuffix(editData.phone || "");
                            if (cur.length >= 9) {
                              e.preventDefault();
                              return;
                            }
                            const next = (cur + e.key).slice(0, 9);
                            setEditData({ ...editData, phone: formatPhoneFromSuffix(next) });
                            e.preventDefault();
                          }}
                          onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
                            const paste = e.clipboardData.getData("Text") || "";
                            const digits = paste.replace(/\D/g, "").slice(0, 9);
                            e.preventDefault();
                            setEditData({ ...editData, phone: formatPhoneFromSuffix(digits) });
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-status" className="text-right">Status</Label>
                        {editData?.assignedVehicle ? (
                          <div className="col-span-3">
                            <div className="px-3 py-2 w-full border rounded bg-muted text-muted-foreground">Assigned</div>
                          </div>
                        ) : editData?.status === 'driving' ? (
                          <div className="col-span-3">
                            <div className="px-3 py-2 w-full border rounded bg-muted text-muted-foreground">Driving</div>
                          </div>
                        ) : (
                          <Select value={editData.status} onValueChange={(v) => setEditData({ ...editData, status: v as any })}>
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="available">Available</SelectItem>
                              <SelectItem value="off-duty">Off Duty</SelectItem>
                              <SelectItem value="inactive" disabled={!!editData?.assignedVehicle}>Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-address" className="text-right">Address</Label>
                          <div className="col-span-3 flex items-center gap-2">
                            <Textarea id="edit-address" name="address" placeholder="Pick address on map" value={editAddress ?? ""} onChange={(e) => { setEditAddress(e.target.value); setEditData({ ...editData, address: e.target.value }); setEditAddressCoords(null); }} className="flex-1 resize-none" rows={2} />
                            <Button type="button" variant="outline" size="sm" className="h-9 w-9 p-0 flex items-center justify-center" onClick={() => setIsAddressPickerOpen(true)}>
                              <MapPin className="h-4 w-4" />
                              <span className="sr-only">Pick address on map</span>
                            </Button>
                          </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" type="button" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                      <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

                {/* Address picker dialog for Edit Profile */}
                <Dialog open={isAddressPickerOpen} onOpenChange={setIsAddressPickerOpen}>
                  <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Pick Address</DialogTitle>
                      <DialogDescription>Click the map to select the address. Use Ctrl + mouse wheel to zoom.</DialogDescription>
                    </DialogHeader>
                    <div style={{ height: 320 }} className="rounded-md overflow-hidden">
                      <MapContainer scrollWheelZoom={false} center={[8.0, 125.0]} zoom={5} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        {
                          (() => {
                            const ClickSelector: React.FC = () => {
                              useMapEvents({
                                click(e) {
                                  const lat = e.latlng.lat;
                                  const lng = e.latlng.lng;
                                  const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                                  (async () => {
                                    try {
                                      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
                                      if (!res.ok) throw new Error('geocode failed');
                                      const data = await res.json();
                                      const address = data.display_name || fallback;
                                      setEditAddress(address);
                                      setEditAddressCoords({ lat, lng });
                                      setEditData({ ...editData, address });
                                    } catch (err) {
                                      setEditAddress(fallback);
                                      setEditAddressCoords({ lat, lng });
                                      setEditData({ ...editData, address: fallback });
                                    }
                                  })();
                                }
                              });
                              return editAddressCoords ? <Marker position={[editAddressCoords.lat, editAddressCoords.lng]} /> : null;
                            };

                            const WheelHandler: React.FC = () => {
                              const map = useMapEvents({});
                              useEffect(() => {
                                const container = map.getContainer();
                                if (!container) return;
                                const onWheel = (e: WheelEvent) => {
                                  if (!e.ctrlKey) return;
                                  e.preventDefault();
                                  const delta = e.deltaY > 0 ? -1 : 1;
                                  if (delta > 0) map.zoomIn();
                                  else map.zoomOut();
                                };
                                container.addEventListener('wheel', onWheel, { passive: false });
                                return () => container.removeEventListener('wheel', onWheel as EventListener);
                              }, [map]);
                              return null;
                            };

                            return (
                              <>
                                <ClickSelector />
                                <WheelHandler />
                              </>
                            );
                          })()
                        }
                      </MapContainer>
                    </div>
                    <div className="mt-3">
                      <Label htmlFor="pickedAddress">Selected Address</Label>
                      <Input id="pickedAddress" value={editAddress ?? ""} readOnly />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => { setIsAddressPickerOpen(false); }}>Cancel</Button>
                      <Button onClick={() => { setIsAddressPickerOpen(false); }}>Use Address</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

              <Button
                className="gap-2"
                onClick={handleOpenAssign}
                disabled={!canAssignVehicle(driver.status) || assignedTruck?.status === 'intransit' || assignedTruck?.status === 'pending'}
                title={assignedTruck?.status === 'intransit' || assignedTruck?.status === 'pending' ? 'Cannot assign while assigned vehicle is In Transit or Pending' : (!canAssignVehicle(driver.status) ? 'Cannot assign while driver is Driving/Off Duty/Inactive/Pending' : 'Assign Vehicle')}
              >
                <Truck className="h-4 w-4" />
                <span>Assign Vehicle</span>
              </Button>

              <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                <DialogContent className="sm:max-w-[520px]">
                  <DialogHeader>
                    <DialogTitle>Assign Vehicle</DialogTitle>
                    <DialogDescription>Select a vehicle to assign to this driver.</DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Select value={selectedTruckId ?? ""} onValueChange={(v) => setSelectedTruckId(v || null)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableVehicles.length === 0 ? (
                          <SelectItem value="__none" disabled>No available vehicles</SelectItem>
                        ) : (
                          availableVehicles.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{`${t.id} — ${t.name} (${t.plateNumber})`}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                    <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAssignOpen(false)}>Cancel</Button>
                    {/* Removed inline Remove Vehicle button; unassign is available on Assigned Vehicle card */}
                    <Button onClick={() => {
                      if (!selectedTruckId) {
                        toast.error("Please select a vehicle to assign.");
                        return;
                      }
                      // update driver's assignedVehicle and set status to assigned
                      if (setDrivers) {
                        setDrivers((prev) => prev.map((d) => d.id === driver.id ? { ...d, assignedVehicle: selectedTruckId, status: "assigned" } : d));
                      } else {
                        try {
                          const raw = localStorage.getItem("drivers");
                          if (raw) {
                            const arr = JSON.parse(raw);
                            const updated = arr.map((d: any) => d.id === driver.id ? { ...d, assignedVehicle: selectedTruckId, status: "assigned" } : d);
                            localStorage.setItem("drivers", JSON.stringify(updated));
                          }
                        } catch (e) {
                          // ignore
                        }
                      }
                      // update previous truck to unassigned if existed
                      if (driver.assignedVehicle) {
                        const prevTruck = trucks.find((t) => t.id === driver.assignedVehicle);
                        if (prevTruck) updateTruck({ ...prevTruck, driver: "Unassigned", status: "available" });
                      }
                      // update the selected truck to reference this driver and mark it as assigned
                      const newTruck = trucks.find((t) => t.id === selectedTruckId);
                      if (newTruck) updateTruck({ ...newTruck, driver: driver.name, status: "assigned" });

                      toast.success("Vehicle assigned to driver");
                      setIsAssignOpen(false);
                    }} disabled={!canAssignVehicle(driver.status)}>Assign</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
          <TabsList>
          <TabsTrigger value="info">Driver Information</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="history">Trip History</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="info" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 items-stretch">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-muted-foreground">Full Name</dt>
                    <dd className="text-sm font-semibold">{driver.name}</dd>
                  </div>

                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-muted-foreground">Date of Birth</dt>
                    <dd className="text-sm font-semibold">{(driver as any).dateOfBirth ? (() => { try { return format(new Date((driver as any).dateOfBirth), "PPP"); } catch { return "-"; } })() : "-"}</dd>
                  </div>

                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-muted-foreground">License</dt>
                    <dd className="text-sm font-semibold">{driver.licenseNumber ?? "-"}</dd>
                  </div>

                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-muted-foreground">License Type</dt>
                    <dd className="text-sm font-semibold">{(() => { const t = (driver as any).licenseType; if (!t) return "Commercial (Class A)"; if (t === "commercial-a") return "Commercial (Class A)"; if (t === "commercial-b") return "Commercial (Class B)"; if (t === "non-commercial") return "Non-Commercial"; return t; })()}</dd>
                  </div>

                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-muted-foreground">License Exp</dt>
                    <dd className="text-sm font-semibold">{(driver as any).licenseExpiry ? (() => { try { return format(new Date((driver as any).licenseExpiry), "PPP"); } catch { return "-"; } })() : "-"}</dd>
                  </div>

                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                    <dd className="text-sm font-semibold">{driver.email ?? "-"}</dd>
                  </div>

                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
                    <dd className="text-sm font-semibold">{driver.phone ?? "-"}</dd>
                  </div>

                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                    <dd className="text-sm font-semibold">{getStatusBadge(driver.status)}</dd>
                  </div>

                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-muted-foreground">Address</dt>
                    <dd className="text-sm font-semibold text-right">{(driver as any).address ?? "-"}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Assigned Vehicle card moved into the grid in place of Employment Details */}
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Truck className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Vehicle Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {driver.assignedVehicle ? (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">{assignedTruck?.name ?? `Vehicle ${driver.assignedVehicle}`}</h3>
                    <dl className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <dt>ID</dt>
                        <dd className="font-medium">{driver.assignedVehicle}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt>Plate Number</dt>
                        <dd className="font-medium">{assignedTruck?.plateNumber ?? "-"}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt>Model</dt>
                        <dd className="font-medium">{assignedTruck?.model ?? "-"}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt>Capacity</dt>
                        <dd className="font-medium">{assignedTruck?.loadCapacity !== undefined && assignedTruck?.loadCapacity !== null ? String(assignedTruck.loadCapacity) : ("-")}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt>Fuel Type</dt>
                        <dd className="font-medium">{assignedTruck?.fuelType ?? "-"}</dd>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <dt>Fuel Level</dt>
                          <dd className="font-medium">{assignedTruck?.fuelLevel ?? "-"}%</dd>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 mt-1 overflow-hidden">
                          <div
                            className={`h-full ${
                              (assignedTruck?.fuelLevel ?? 0) > 70
                                ? "bg-status-available"
                                : (assignedTruck?.fuelLevel ?? 0) > 30
                                ? "bg-status-pending"
                                : "bg-status-maintenance"
                            }`}
                            style={{ width: `${assignedTruck?.fuelLevel ?? 0}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <dt>Status</dt>
                        <dd className="font-medium">{assignedTruck?.status ?? "-"}</dd>
                      </div>
                    </dl>

                    <div className="mt-2 flex items-center w-full">
                      <div>
                        <Button variant="outline" onClick={() => navigate(`/trucks/${driver.assignedVehicle}`)}>
                          View Vehicle Details
                        </Button>
                      </div>
                      <div className="ml-auto">
                        <Button
                          variant="destructive"
                          className="bg-rose-600 text-white hover:bg-rose-700"
                          onClick={handleRemoveVehicle}
                          disabled={isUnassignBlocked}
                          title={isUnassignBlocked ? 'Cannot unassign while vehicle or driver is Pending/In Transit' : 'Unassign vehicle'}
                        >
                          Unassign
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No vehicle currently assigned to this driver.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Schedule</CardTitle>
              <CardDescription>Driver's availability and work hours</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {(() => {
                    const days: Date[] = [];
                    const now = new Date();
                    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    for (let i = 0; i < 7; i++) {
                      const d = new Date(start);
                      d.setDate(start.getDate() + i);
                      days.push(d);
                    }

                    // load trips for this driver
                    let tripsForDriver: any[] = [];
                    try {
                      const raw = localStorage.getItem('trips');
                      const all = raw ? (JSON.parse(raw) as any[]) : [];
                      tripsForDriver = all.filter((t) => String(t.driverId) === String(driver.id) || String(t.driver) === String(driver.id) || String(t.driver) === String(driver.name));
                    } catch (e) {
                      tripsForDriver = [];
                    }

                    const formatDay = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'short' });
                    const formatShort = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

                    return days.map((day) => {
                      const dayTrips = tripsForDriver.filter((t) => {
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
              <CardDescription>Recent trips completed by this driver</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {(() => {
                  let completedTrips: any[] = [];
                  try {
                    const raw = localStorage.getItem("trips");
                    const all = raw ? (JSON.parse(raw) as any[]) : [];
                    completedTrips = all
                      .filter((t) => (String(t.driverId) === String(driver.id) || String(t.driver) === String(driver.id) || String(t.driver) === String(driver.name)) && (t.status === "completed" || t.status === "done"))
                      .sort((a, b) => {
                        const da = new Date(a.arrivalDate || a.endTime || a.departureDate || a.createdAt || 0).getTime();
                        const db = new Date(b.arrivalDate || b.endTime || b.departureDate || b.createdAt || 0).getTime();
                        return db - da;
                      });
                  } catch (e) {
                    completedTrips = [];
                  }

                  if (!completedTrips || completedTrips.length === 0) {
                    return <div className="text-sm italic text-muted-foreground">No completed trips for this driver.</div>;
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
                        <div className="text-xs bg-muted px-2 py-1 rounded-md">Vehicle: {trip.truckId || trip.vehicle || trip.truck || driver.assignedVehicle || '—'}</div>
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
              <CardTitle>Driver Documents</CardTitle>
              <CardDescription>License, certifications, and other important documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <DocumentItem
                  title="Commercial Driver's License"
                  number={driver.licenseNumber}
                  issueDate={new Date(2020, 0, 15)}
                  expiryDate={new Date(2024, 11, 31)}
                  onUploaded={() => setActiveTab('documents')}
                  ownerKey={driver.id}
                />
                
                <DocumentItem
                  title="Medical Certificate"
                  number="MED-789456"
                  issueDate={new Date(2023, 5, 10)}
                  expiryDate={new Date(2025, 5, 10)}
                  onUploaded={() => setActiveTab('documents')}
                  ownerKey={driver.id}
                />
                
                <DocumentItem
                  title="Hazardous Materials Endorsement"
                  number="HAZ-456123"
                  issueDate={new Date(2021, 2, 22)}
                  expiryDate={new Date(2026, 2, 22)}
                  onUploaded={() => setActiveTab('documents')}
                  ownerKey={driver.id}
                />
                
                <DocumentItem
                  title="Transportation Worker ID Card"
                  number="TWIC-123789"
                  issueDate={new Date(2022, 7, 5)}
                  expiryDate={new Date(2027, 7, 5)}
                  onUploaded={() => setActiveTab('documents')}
                  ownerKey={driver.id}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface ScheduleItemProps {
  status: "current" | "upcoming" | "completed";
  origin: string;
  destination: string;
  departureDate: Date;
  arrivalDate: Date;
  truckId: string | null;
}

export const ScheduleItem: React.FC<ScheduleItemProps> = ({
  status,
  origin,
  destination,
  departureDate,
  arrivalDate,
  truckId,
}) => {
  const statusStyles = {
    current: "border-primary/50 bg-primary/5",
    upcoming: "border-muted",
    completed: "border-muted bg-muted/10",
  };

  return (
    <div className={`border rounded-md p-4 ${statusStyles[status]}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-3">
        <h3 className="font-semibold">
          {status === "current" ? "Current Trip" : "Upcoming Trip"}
        </h3>
        {status === "current" && (
          <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none w-fit mt-1 md:mt-0">
            In Progress
          </Badge>
        )}
      </div>
      
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">From</div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium">{origin}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{format(departureDate, "PPP")}</span>
              <Clock className="h-3 w-3 ml-2" />
              <span>{format(departureDate, "p")}</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">To</div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium">{destination}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{format(arrivalDate, "PPP")}</span>
              <Clock className="h-3 w-3 ml-2" />
              <span>{format(arrivalDate, "p")}</span>
            </div>
          </div>
        </div>
        
        {truckId && (
          <div className="flex items-center gap-1 text-sm">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <span>Vehicle: {truckId}</span>
          </div>
        )}
      </div>
    </div>
  );
};

interface DocumentItemProps {
  title: string;
  number: string;
  issueDate: Date;
  expiryDate: Date;
  onUploaded?: () => void;
  ownerKey?: string; // optional owner id (driver id or truck id) to namespace stored documents
}

export const DocumentItem: React.FC<DocumentItemProps> = ({
  title,
  number,
  issueDate,
  expiryDate,
  onUploaded,
}) => {
  const now = new Date();
  const isExpiringSoon = expiryDate.getTime() - now.getTime() < 90 * 24 * 60 * 60 * 1000; // 90 days
  const isExpired = expiryDate < now;
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const keyBase = (ownerKey && `doc:${ownerKey}:${title}`) || `doc:${number}:${title}`;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const dataUrl = reader.result as string;
        const rec = { name: file.name, type: file.type || "application/octet-stream", dataUrl };
        try { localStorage.setItem(keyBase, JSON.stringify(rec)); } catch (e) { /* ignore storage errors */ }
        toast.success(`${file.name} uploaded`);
      } catch (err) {
        // ignore
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
      onUploaded?.();
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    const keyBase = (ownerKey && `doc:${ownerKey}:${title}`) || `doc:${number}:${title}`;
    try {
      const raw = localStorage.getItem(keyBase);
      if (!raw) {
        toast.error('No uploaded file available to download');
        return;
      }
      const rec = JSON.parse(raw) as { name: string; type: string; dataUrl: string };
      const a = document.createElement('a');
      a.href = rec.dataUrl;
      a.download = rec.name || `${title}.bin`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success(`Downloading ${rec.name}`);
    } catch (e) {
      toast.error('Failed to download file');
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-md">
      <div>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="font-medium">{title}</h3>
        </div>
        <div className="ml-7 text-sm text-muted-foreground">{number}</div>
      </div>

      

      <div className="ml-7 md:ml-0 mt-2 md:mt-0 flex items-center gap-2">
        <input ref={fileInputRef} type="file" accept="*/*" className="hidden" onChange={handleFileChange} />
        <Button variant="outline" size="sm" onClick={handleUploadClick}>
          Upload
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload}>
          Download
        </Button>
      </div>
    </div>
  );
};

export default DriverDetails;
