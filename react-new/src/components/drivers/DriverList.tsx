
import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { filterDrivers } from "./data/driverData";
import DriverListFilters from "./driver-list/DriverListFilters";
import DriverTable from "./driver-list/DriverTable";
import type { DriverType } from "@/pages/Drivers";
import DriverListPagination from "./driver-list/DriverListPagination";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { PlusCircle, MapPin } from "lucide-react";
import { formatLicense, formatPhoneFromSuffix, extractPhoneSuffix, formatPhoneFromAny } from "@/lib/utils";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";
import { useTruckContext } from "@/context/TruckContext";
import { useNotifications } from "@/contexts/NotificationContext";

const DriverList: React.FC<{ drivers?: DriverType[]; setDrivers?: React.Dispatch<React.SetStateAction<DriverType[]>> }> = ({ drivers: driversProp, setDrivers: setDriversProp }) => {
  const [addLicenseType, setAddLicenseType] = useState("commercial-a");
  const [addLicenseExpiry, setAddLicenseExpiry] = useState("");
  const [addDOB, setAddDOB] = useState("");
  const [addAddress, setAddAddress] = useState("");
  const [addAddressCoords, setAddAddressCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isAddressPickerOpen, setIsAddressPickerOpen] = useState(false);

  const [localDrivers, setLocalDrivers] = useState<DriverType[]>(() => {
    try {
      const raw = localStorage.getItem("drivers");
      return raw ? (JSON.parse(raw) as DriverType[]) : [];
    } catch {
      return [];
    }
  });

  const drivers = driversProp ?? localDrivers;
  const setDrivers = setDriversProp ?? setLocalDrivers;
  const { toast: notifyToast } = useToast();
  const truckCtx = useTruckContext();
  const { addNotification } = useNotifications();

  const addFormRef = useRef<HTMLFormElement | null>(null);
  const [addLicense, setAddLicense] = useState("");
  const [addPhoneSuffix, setAddPhoneSuffix] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  

  const resetAddForm = () => {
    setAddLicense("");
    setAddPhoneSuffix("");
    setAddDOB("");
    setAddAddress("");
    setAddAddressCoords(null);
    if (addFormRef.current) {
      try {
        addFormRef.current.reset();
      } catch (e) {
        // ignore
      }
    }
  };
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleEditDriver = (driver: DriverType) => {
    // reflect assigned status immediately if driver already has a vehicle
    setEditingDriver({ ...driver, status: driver.assignedVehicle ? "assigned" : driver.status });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingDriver) return;
    // ensure drivers with assignedVehicle remain 'assigned'
    const finalDriver = { ...editingDriver } as DriverType;
    if (finalDriver.assignedVehicle) finalDriver.status = "assigned";

    // Prevent setting to off-duty/inactive if driver has an assigned vehicle
    if (finalDriver.assignedVehicle && (finalDriver.status === "off-duty" || finalDriver.status === "inactive")) {
      toast.error("Cannot set driver to Off Duty or Inactive while a vehicle is assigned.");
      return;
    }

    // update drivers list
    // capture previous assignment before updating drivers
    let previousAssigned: string | null = null;
    try {
      const prev = (drivers || []).find((d) => d.id === finalDriver.id);
      previousAssigned = prev?.assignedVehicle ?? null;
    } catch (e) {
      previousAssigned = null;
    }

    setDrivers((prev) => prev.map((d) => (d.id === finalDriver.id ? finalDriver : d)));
    // Attempt to persist update to backend (best-effort)
    try {
      await apiFetch(`/api/drivers/${finalDriver.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: finalDriver.name,
          license_number: finalDriver.licenseNumber,
          email: finalDriver.email,
          phone: finalDriver.phone,
          status: finalDriver.status,
          license_type: finalDriver.licenseType,
          license_expiry: finalDriver.licenseExpiry,
          date_of_birth: finalDriver.dateOfBirth,
          address: finalDriver.address,
          assigned_vehicle: finalDriver.assignedVehicle,
        }),
      });
    } catch (err) {
      // ignore network errors; local state already updated
    }
    notifyToast({
      title: "Driver Status Updated",
      description: `${finalDriver.name} status changed to ${finalDriver.status}`
    });

    // sync truck status when driver status or assignment changes
    try {
      const { trucks, updateTruck } = truckCtx;

      // If driver was previously assigned to another truck and it's different now, free the old truck
      if (previousAssigned && previousAssigned !== finalDriver.assignedVehicle) {
        const oldTruck = trucks.find((t) => String(t.id) === String(previousAssigned));
        if (oldTruck) {
          const freed = { ...oldTruck, driver: "Unassigned", status: "available" };
          // update context
          updateTruck(freed);
          // persist immediately so components that read localStorage stay in sync
          try {
            const raw = localStorage.getItem("trucks");
            if (raw) {
              const arr = JSON.parse(raw) as any[];
              const updated = arr.map((t) => (String(t.id) === String(previousAssigned) ? { ...t, driver: "Unassigned", status: "available" } : t));
              localStorage.setItem("trucks", JSON.stringify(updated));
            }
          } catch (err) {
            // ignore
          }
        } else {
          // fallback: update localStorage directly
          try {
            const raw = localStorage.getItem("trucks");
            if (raw) {
              const arr = JSON.parse(raw) as any[];
              const updated = arr.map((t) => (t.id === previousAssigned ? { ...t, driver: "Unassigned", status: "available" } : t));
              localStorage.setItem("trucks", JSON.stringify(updated));
            }
          } catch (err) {
            // ignore
          }
        }
      }

      // If driver is now assigned to a truck, ensure that truck references this driver and has correct status
      const newAssigned = finalDriver.assignedVehicle;
      if (newAssigned) {
        const newTruck = trucks.find((t) => String(t.id) === String(newAssigned));
        if (newTruck) {
          let desiredStatus = newTruck.status;
          if (finalDriver.status === "driving") {
            desiredStatus = "intransit";
          } else if (finalDriver.status === "assigned") {
            desiredStatus = "assigned";
          } else if (newTruck.status === "intransit") {
            desiredStatus = "available";
          } else {
            desiredStatus = "available";
          }

          if (desiredStatus !== newTruck.status || newTruck.driver !== finalDriver.id) {
            const updatedTruck = { ...newTruck, driver: finalDriver.id, status: desiredStatus };
            updateTruck(updatedTruck);
            try {
              const raw = localStorage.getItem("trucks");
              if (raw) {
                const arr = JSON.parse(raw) as any[];
                const updated = arr.map((t) => (String(t.id) === String(newAssigned) ? { ...t, driver: finalDriver.id, status: desiredStatus } : t));
                localStorage.setItem("trucks", JSON.stringify(updated));
              }
            } catch (err) {
              // ignore
            }
          }

          // Ensure no other truck still references this driver (by id or name). Clear them.
          try {
            const others = trucks.filter((t) => String(t.id) !== String(newAssigned) && (String(t.driver) === String(finalDriver.id) || String(t.driver) === String(finalDriver.name)));
            if (others.length > 0) {
              others.forEach((ot) => {
                const freed = { ...ot, driver: "Unassigned", status: "available" };
                updateTruck(freed);
              });
              try {
                const raw2 = localStorage.getItem("trucks");
                if (raw2) {
                  const arr2 = JSON.parse(raw2) as any[];
                  const updated2 = arr2.map((t) => (String(t.driver) === String(finalDriver.id) || String(t.driver) === String(finalDriver.name) ? { ...t, driver: "Unassigned", status: "available" } : t));
                  localStorage.setItem("trucks", JSON.stringify(updated2));
                }
              } catch (err) {
                // ignore
              }
            }
          } catch (err) {
            // ignore
          }
        } else {
          // fallback: persist to localStorage
          try {
            const raw = localStorage.getItem("trucks");
            if (raw) {
              const arr = JSON.parse(raw) as any[];
              const updated = arr.map((t) => (t.id === newAssigned ? { ...t, driver: finalDriver.id, status: finalDriver.status === 'driving' ? 'intransit' : (finalDriver.status === 'assigned' ? 'assigned' : 'available') } : t));
              localStorage.setItem("trucks", JSON.stringify(updated));
            }
          } catch (err) {
            // ignore
          }
        }
      }
    } catch (e) {
      // ignore if truck context not available
    }
    setIsEditOpen(false);
    setEditingDriver(null);
  };

  const handleDeleteOpen = (id: string) => {
    setConfirmDeleteId(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    // prevent deleting a driver who has scheduled or active trips
    try {
      const rawTrips = localStorage.getItem('trips');
      if (rawTrips) {
        const tripsArr = JSON.parse(rawTrips) as any[];
        const blocked = tripsArr.some((t) => (String(t.driverId) === String(confirmDeleteId) || String(t.driver) === String(confirmDeleteId)) && t.status !== 'completed' && t.status !== 'cancelled');
        if (blocked) {
          toast.error('Cannot delete driver while they have scheduled or active trips.');
          setIsDeleteOpen(false);
          setConfirmDeleteId(null);
          return;
        }
      }
    } catch (e) {
      // ignore and proceed
    }

    try {
      // if driver had an assigned vehicle, free that truck
      const toDelete = drivers?.find((d) => d.id === confirmDeleteId);
      if (toDelete && toDelete.assignedVehicle) {
        try {
          const { trucks, updateTruck } = truckCtx;
          const truck = trucks.find((t) => t.id === toDelete.assignedVehicle);
          if (truck) updateTruck({ ...truck, driver: "Unassigned", status: "available" });
        } catch (e) {
          // fallback: update localStorage drivers/trucks if context not available
          try {
            const rawTrucks = localStorage.getItem("trucks");
            if (rawTrucks) {
              const arr = JSON.parse(rawTrucks) as any[];
              const updated = arr.map((t) => (t.id === toDelete.assignedVehicle ? { ...t, driver: "Unassigned", status: "available" } : t));
              localStorage.setItem("trucks", JSON.stringify(updated));
            }
          } catch (er) {
            // ignore
          }
        }
      }
    } catch (e) {
      // ignore
    }

    // Try to delete from backend, then remove locally regardless
    try {
      await apiFetch(`/api/drivers/${confirmDeleteId}`, { method: 'DELETE' });
    } catch (err) {
      // ignore
    }

    setDrivers((prev) => prev.filter((d) => d.id !== confirmDeleteId));
    setIsDeleteOpen(false);
    setConfirmDeleteId(null);
  };
  // Filter drivers based on search term and status filter
  const applyFilters = (list: DriverType[]) =>
    list.filter((driver) => {
      const matchesSearch =
        driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || driver.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

  const filteredDrivers = drivers ? applyFilters(drivers) : filterDrivers(searchTerm, statusFilter);
  // Pagination
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredDrivers.length / pageSize));
  const [currentPage, setCurrentPage] = useState(1);
  // clamp current page when filters change
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages]);

  const visibleDrivers = filteredDrivers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <Card>
      <CardHeader className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Driver Management</CardTitle>
            <CardDescription>
              Manage your drivers and their assignments
            </CardDescription>
          </div>
          <div>
            <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (open) resetAddForm(); if (!open) resetAddForm(); }}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  <span>Add Driver</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form
                  ref={addFormRef}
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget as HTMLFormElement);
                    const name = String(formData.get("name") || "").trim();
                    const licenseNumber = String(addLicense || formData.get("licenseNumber") || "").trim();
                    const email = String(formData.get("email") || "").trim();
                    const phone = formatPhoneFromSuffix(addPhoneSuffix);
                    const status = String(formData.get("status") || "available") as any;
                    const dateOfBirth = String(formData.get("dateOfBirth") || addDOB || "");
                    const licenseExpiry = String(formData.get("licenseExpiry") || addLicenseExpiry || "").trim();
                    const address = String(formData.get("address") || addAddress || "").trim();

                    // Basic validation: ensure required fields are present
                    if (!name) {
                      toast.error("Please enter the driver's name.");
                      return;
                    }

                    // require date of birth and license expiry
                    if (!dateOfBirth) {
                      toast.error("Date of Birth is required.");
                      return;
                    }

                    if (!licenseExpiry) {
                      toast.error("License Exp is required.");
                      return;
                    }

                    if (!address) {
                      toast.error("Address is required.");
                      return;
                    }

                    // license must contain 12 digits (formatted as XXXX-XXX-XXXXX)
                    const licenseDigits = (licenseNumber || "").replace(/\D/g, "");
                    if (licenseDigits.length !== 12) {
                      toast.error("Please enter a valid 12-digit license number.");
                      return;
                    }

                    if (!email || !email.includes("@")) {
                      toast.error("Please enter a valid email address.");
                      return;
                    }

                    // phone suffix should be 9 digits (format +63-9XX-XXX-XXXX)
                    const phoneDigits = String(addPhoneSuffix || "").replace(/\D/g, "");
                    if (phoneDigits.length !== 9) {
                      toast.error("Please enter a complete phone number.");
                      return;
                    }

                    // generate sequence
                    let seq = 1;
                    // check duplicates: license and phone
                    const existingDriversList: DriverType[] = drivers ?? (() => {
                      try {
                        const raw = localStorage.getItem("drivers");
                        return raw ? (JSON.parse(raw) as DriverType[]) : [];
                      } catch {
                        return [];
                      }
                    })();

                    const licenseFormatted = formatLicense(licenseNumber);
                    const phoneFormatted = phone;

                    if (existingDriversList.some((d) => (d.licenseNumber || "") === licenseFormatted)) {
                      toast.error("A driver with this license number already exists.");
                      return;
                    }

                    // prevent duplicate email
                    if (existingDriversList.some((d) => (d.email || "").toLowerCase() === email.toLowerCase())) {
                      toast.error("A driver with this email already exists.");
                      return;
                    }

                    const newSuffix = extractPhoneSuffix(phoneFormatted);
                    if (existingDriversList.some((d) => extractPhoneSuffix(d.phone || "") === newSuffix)) {
                      toast.error("A driver with this phone number already exists.");
                      return;
                    }
                    try {
                      const stored = localStorage.getItem("driver_seq");
                      if (stored) {
                        seq = Number(stored) + 1;
                      } else {
                        const nums = (drivers || [])
                          .map((d) => {
                            const m = d.id.match(/^D-(\d+)$/);
                            return m ? Number(m[1]) : null;
                          })
                          .filter((n): n is number => n !== null);
                        const max = nums.length ? Math.max(...nums) : 0;
                        seq = Math.max(max + 1, (drivers || []).length + 1);
                      }
                      localStorage.setItem("driver_seq", String(seq));
                    } catch (err) {
                      seq = (drivers || []).length + 1;
                    }

                    const newId = `D-${String(seq).padStart(3, "0")}`;

                    const licenseType = String(formData.get("licenseType") || addLicenseType);
                    const dateOfBirthFinal = dateOfBirth || "";

                    const newDriver: DriverType = {
                      id: newId,
                      name,
                      licenseNumber: formatLicense(licenseNumber),
                      email,
                      phone,
                      status,
                      licenseType,
                      licenseExpiry,
                      dateOfBirth: dateOfBirthFinal,
                      address,
                      assignedVehicle: null,
                    };

                    // Try to persist to backend, fallback to localStorage
                    try {
                      const res = await apiFetch('/api/drivers', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          id: newDriver.id,
                          name: newDriver.name,
                          license_number: newDriver.licenseNumber,
                          email: newDriver.email,
                          phone: newDriver.phone,
                          status: newDriver.status,
                          license_type: newDriver.licenseType,
                          license_expiry: newDriver.licenseExpiry,
                          date_of_birth: newDriver.dateOfBirth,
                          address: newDriver.address,
                          assigned_vehicle: newDriver.assignedVehicle,
                        }),
                      });

                      if (res.ok) {
                        const saved = await res.json();
                        const savedDriver: any = {
                          id: String(saved.id),
                          name: saved.name,
                          licenseNumber: saved.license_number || saved.licenseNumber,
                          email: saved.email,
                          phone: saved.phone,
                          status: saved.status || 'available',
                          licenseType: saved.license_type || saved.licenseType,
                          licenseExpiry: saved.license_expiry || saved.licenseExpiry,
                          dateOfBirth: saved.date_of_birth || saved.dateOfBirth,
                          address: saved.address,
                          assignedVehicle: saved.assigned_vehicle || saved.assignedVehicle || null,
                        };
                        setDrivers((prev) => [savedDriver as any, ...prev]);
                      } else {
                        setDrivers((prev) => [newDriver, ...prev]);
                      }
                    } catch (err) {
                      setDrivers((prev) => [newDriver, ...prev]);
                    }
                    setIsAddOpen(false);
                    toast.success(`Driver ${name} added successfully.`);
                    try {
                      addNotification({ title: "New Driver Added", message: `${name} has been added to drivers`, type: 'info', url: `/drivers/${newId}` });
                    } catch (e) {}
                  }}
                >
                  <DialogHeader>
                    <DialogTitle>Add New Driver</DialogTitle>
                    <DialogDescription>Enter the details of the new driver below.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">Full Name</Label>
                      <Input id="name" name="name" placeholder="Enter driver name" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="dateOfBirth" className="text-right">Date of Birth</Label>
                      <Input id="dateOfBirth" name="dateOfBirth" type="date" value={addDOB} onChange={(e) => setAddDOB(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="licenseNumber" className="text-right">License</Label>
                      <Input
                        id="licenseNumber"
                        name="licenseNumber"
                        placeholder="Enter CDL number"
                        className="col-span-3"
                        value={addLicense}
                        onChange={(e) => setAddLicense(formatLicense(e.target.value))}
                        inputMode="numeric"
                        pattern="^\d{4}-\d{3}-\d{5}$"
                        onKeyDown={(e) => {
                          const allowed = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End"];
                          if (allowed.includes(e.key)) return;
                          // block non-digits
                          if (!/^[0-9]$/.test(e.key)) {
                            e.preventDefault();
                            return;
                          }
                          // block digits if already at max (12)
                          const currentDigits = (addLicense || "").replace(/\D/g, "").length;
                          if (currentDigits >= 12) e.preventDefault();
                        }}
                        onPaste={(e: any) => {
                          const paste = e.clipboardData.getData("Text") || "";
                          const digits = paste.replace(/\D/g, "").slice(0, 12);
                          e.preventDefault();
                          setAddLicense(formatLicense(digits));
                        }}
                      />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="licenseType" className="text-right">License Type</Label>
                        <Select name="licenseType" defaultValue={addLicenseType}>
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
                        <Label htmlFor="licenseExpiry" className="text-right">License Exp</Label>
                          <Input id="licenseExpiry" name="licenseExpiry" type="date" className="col-span-3" />
                      </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">Email</Label>
                      <Input id="email" name="email" type="email" placeholder="Enter email address" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="phone" className="text-right">Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        placeholder="+63-9XX-XXX-YYYY"
                        className="col-span-3"
                        value={formatPhoneFromSuffix(addPhoneSuffix)}
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                          const allowed = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End"];
                          if (allowed.includes(e.key)) {
                            if (e.key === "Backspace") {
                              setAddPhoneSuffix((s) => s.slice(0, -1));
                            }
                            return;
                          }
                          if (!/^[0-9]$/.test(e.key)) {
                            e.preventDefault();
                            return;
                          }
                          const currentDigits = (addPhoneSuffix || "").replace(/\D/g, "").length;
                          if (currentDigits >= 9) {
                            e.preventDefault();
                            return;
                          }
                          setAddPhoneSuffix((s) => (s + e.key).slice(0, 9));
                          e.preventDefault();
                        }}
                        onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
                          const paste = e.clipboardData.getData("Text") || "";
                          const digits = paste.replace(/\D/g, "").slice(0, 9);
                          e.preventDefault();
                          setAddPhoneSuffix(digits);
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="status" className="text-right">Status</Label>
                      <Select name="status" defaultValue="available">
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                              <SelectItem value="available">Available</SelectItem>
                              <SelectItem value="off-duty">Off Duty</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="address" className="text-right">Address</Label>
                      <div className="col-span-3 flex items-center gap-2">
                        <Textarea id="address" name="address" value={addAddress} placeholder="Pick address on map" onChange={(e) => { setAddAddress(e.target.value); setAddAddressCoords(null); }} className="flex-1 resize-none" rows={3} />
                        <Button type="button" size="sm" variant="outline" className="h-9 w-9 p-0 flex items-center justify-center" onClick={() => setIsAddressPickerOpen(true)}>
                          <MapPin className="h-4 w-4" />
                          <span className="sr-only">Pick address</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Add Driver</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            {/* Address picker dialog */}
            <Dialog open={isAddressPickerOpen} onOpenChange={setIsAddressPickerOpen}>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Pick Address</DialogTitle>
                  <DialogDescription>Click the map to select the driver's address.</DialogDescription>
                </DialogHeader>
                <div style={{ height: 320 }} className="rounded-md overflow-hidden">
                  <MapContainer scrollWheelZoom={false} center={[8.0, 125.0]} zoom={5} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {/* Click selector */}
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
                                  setAddAddress(address);
                                  setAddAddressCoords({ lat, lng });
                                } catch (err) {
                                  setAddAddress(fallback);
                                  setAddAddressCoords({ lat, lng });
                                }
                              })();
                            }
                          });
                          return addAddressCoords ? <Marker position={[addAddressCoords.lat, addAddressCoords.lng]} /> : null;
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
                  <Input id="pickedAddress" value={addAddress} readOnly />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setIsAddressPickerOpen(false); }}>Cancel</Button>
                  <Button onClick={() => setIsAddressPickerOpen(false)}>Use Address</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <DriverListFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />

        <DriverTable drivers={visibleDrivers} onEdit={handleEditDriver} onDelete={handleDeleteOpen} />

        {/* Edit Driver Dialog (inline) */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Driver</DialogTitle>
              <DialogDescription>Update the driver details. Click save when you're done.</DialogDescription>
            </DialogHeader>
            {editingDriver && (
              <form onSubmit={handleSaveEdit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="edit-name"
                      value={editingDriver.name}
                      onChange={(e) => setEditingDriver({ ...editingDriver, name: e.target.value })}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-licenseNumber" className="text-right">
                      License
                    </Label>
                      <Input
                      id="edit-licenseNumber"
                      value={editingDriver.licenseNumber}
                      onChange={(e) => setEditingDriver({ ...editingDriver, licenseNumber: formatLicense(e.target.value) })}
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
                        const currentDigits = (editingDriver?.licenseNumber || "").replace(/\D/g, "").length;
                        if (currentDigits >= 12) e.preventDefault();
                      }}
                      onPaste={(e: any) => {
                        const paste = e.clipboardData.getData("Text") || "";
                        const digits = paste.replace(/\D/g, "").slice(0, 12);
                        e.preventDefault();
                        setEditingDriver({ ...editingDriver, licenseNumber: formatLicense(digits) });
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-email" className="text-right">
                      Email
                    </Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editingDriver.email}
                      onChange={(e) => setEditingDriver({ ...editingDriver, email: e.target.value })}
                      placeholder="Enter email address"
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-phone" className="text-right">
                      Phone
                    </Label>
                    <Input
                      id="edit-phone"
                      value={formatPhoneFromAny(editingDriver.phone)}
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        const allowed = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End"];
                        if (allowed.includes(e.key)) {
                          if (e.key === "Backspace") {
                            const cur = extractPhoneSuffix(editingDriver.phone || "");
                            setEditingDriver({ ...editingDriver, phone: formatPhoneFromSuffix(cur.slice(0, -1)) });
                          }
                          return;
                        }
                        if (!/^[0-9]$/.test(e.key)) {
                          e.preventDefault();
                          return;
                        }
                        const cur = extractPhoneSuffix(editingDriver.phone || "");
                        if (cur.length >= 9) {
                          e.preventDefault();
                          return;
                        }
                        const next = (cur + e.key).slice(0, 9);
                        setEditingDriver({ ...editingDriver, phone: formatPhoneFromSuffix(next) });
                        e.preventDefault();
                      }}
                      onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
                        const paste = e.clipboardData.getData("Text") || "";
                        const digits = paste.replace(/\D/g, "").slice(0, 9);
                        e.preventDefault();
                        setEditingDriver({ ...editingDriver, phone: formatPhoneFromSuffix(digits) });
                      }}
                      placeholder="+63-9XX-XXX-YYYY"
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-status" className="text-right">Status</Label>
                    {editingDriver?.assignedVehicle ? (
                      <div className="col-span-3">
                        <div className="px-3 py-2 w-full border rounded bg-muted text-muted-foreground">Assigned</div>
                      </div>
                    ) : editingDriver?.status === "driving" ? (
                      <div className="col-span-3">
                        <div className="px-3 py-2 w-full border rounded bg-muted text-muted-foreground">Driving</div>
                      </div>
                    ) : (
                      <Select
                        value={editingDriver.status}
                        onValueChange={(value) => setEditingDriver({ ...editingDriver, status: value as DriverType["status"] })}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="off-duty">Off Duty</SelectItem>
                          <SelectItem value="inactive" disabled={!!editingDriver?.assignedVehicle}>Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => { setIsEditOpen(false); setEditingDriver(null); }}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        <DriverListPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(p) => setCurrentPage(p)}
        />
      </CardContent>
      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete Driver</DialogTitle>
            <DialogDescription>Are you sure you want to delete this driver? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDeleteOpen(false); setConfirmDeleteId(null); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default DriverList;
