import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/contexts/NotificationContext";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Truck, PlusCircle } from "lucide-react";
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
import StatusBadge from "@/components/ui/StatusBadge";

import type { TruckType } from "@/types/truck";
import { useTruckContext } from "@/context/TruckContext";
import DriverListPagination from "@/components/drivers/driver-list/DriverListPagination";
import TruckTableRow from "@/components/trucks/truck-list/TruckTableRow";

const TruckList = () => {
  const navigate = useNavigate();
  const { toast: notifyToast } = useToast();
  const { trucks, addTruck, updateTruck, deleteTruck } = useTruckContext();
  const { addNotification } = useNotifications();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [isAddTruckOpen, setIsAddTruckOpen] = useState(false);
  const [isEditTruckOpen, setIsEditTruckOpen] = useState(false);
  const [editingTruck, setEditingTruck] = useState<TruckType | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [truckToDelete, setTruckToDelete] = useState<string | null>(null);

  const [newTruck, setNewTruck] = useState({
    name: "",
    plateNumber: "",
    model: "",
    driver: "",
    fuelLevel: 100,
    loadCapacity: undefined as number | undefined,
    fuelType: "Diesel",
    status: "available" as const,
  });

  const sanitizeCapacity = (raw: string) => {
    if (!raw) return 0;
    let s = raw.replace(/[^0-9.]/g, "");
    const parts = s.split(".");
    const intPart = parts[0].slice(0, 2);
    let frac = parts[1] || "";
    frac = frac.slice(0, 1);
    const joined = frac ? `${intPart}.${frac}` : intPart;
    const num = Number(joined);
    if (Number.isNaN(num)) return 0;
    return num;
  };

  const formatPlate = (raw: string) => {
    const letters = (raw.match(/[A-Za-z]/g) || []).join("").slice(0, 3).toUpperCase();
    const digits = (raw.match(/\d/g) || []).join("").slice(0, 4);
    if (letters && digits) return `${letters}-${digits}`;
    if (letters) return letters;
    if (digits) return digits;
    return "";
  };

  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTruck({ ...newTruck, plateNumber: formatPlate(e.target.value) });
  };

  const handleAddTruck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTruck.name || String(newTruck.name).trim() === "") { toast.error("Name is required"); return; }
    if (!newTruck.plateNumber || String(newTruck.plateNumber).trim() === "") { toast.error("Plate Number is required"); return; }
    if (!newTruck.model || String(newTruck.model).trim() === "") { toast.error("Model is required"); return; }
    if (newTruck.loadCapacity === undefined || newTruck.loadCapacity === null || Number.isNaN(Number(newTruck.loadCapacity))) { toast.error("Capacity is required"); return; }
    const plateRegex = /^[A-Z]{3}-\d{4}$/;
    if (!plateRegex.test(newTruck.plateNumber)) { toast.error("Plate number must be in format ABC-1234"); return; }
    const exists = trucks.some((t) => (t.plateNumber || "").toUpperCase() === (newTruck.plateNumber || "").toUpperCase());
    if (exists) { toast.error("A truck with this plate number already exists"); return; }

    let seq = 1;
    try {
      const stored = localStorage.getItem("truck_seq");
      if (stored) seq = Number(stored) + 1;
      else {
        const nums = trucks.map((t) => { const m = t.id.match(/^T-(\d+)$/); return m ? Number(m[1]) : null; }).filter((n): n is number => n !== null);
        const max = nums.length ? Math.max(...nums) : 0;
        seq = Math.max(max + 1, trucks.length + 1);
      }
      localStorage.setItem("truck_seq", String(seq));
    } catch (err) { seq = trucks.length + 1; }

    const newId = `T-${String(seq).padStart(3, "0")}`;
    const truckToAdd: TruckType = { id: newId, name: newTruck.name, plateNumber: newTruck.plateNumber, model: newTruck.model, driver: newTruck.driver, fuelLevel: Number(newTruck.fuelLevel), loadCapacity: Number(newTruck.loadCapacity || 0), fuelType: newTruck.fuelType || "Diesel", status: newTruck.status as TruckType["status"], lastMaintenance: new Date().toISOString().slice(0,10) };

    if (truckToAdd.loadCapacity !== undefined && Number(truckToAdd.loadCapacity) > 99) { toast.error("Capacity must be at most 2 digits (max 99)"); return; }
    if (truckToAdd.status === "intransit" && (!truckToAdd.driver || truckToAdd.driver === "" || truckToAdd.driver === "Unassigned")) { toast.error("Cannot mark 'In Transit' without an assigned driver"); return; }

    // Try to persist to backend first; fall back to localStorage on error
    try {
      const res = await apiFetch("/api/trucks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: truckToAdd.id,
          name: truckToAdd.name,
          plate_number: truckToAdd.plateNumber,
          model: truckToAdd.model,
          driver: truckToAdd.driver,
          fuel_level: Number(truckToAdd.fuelLevel),
          load_capacity: Number(truckToAdd.loadCapacity || 0),
          fuel_type: truckToAdd.fuelType,
          status: truckToAdd.status,
          last_maintenance: truckToAdd.lastMaintenance,
        }),
      });

      if (res.ok) {
        const saved = await res.json();
        // normalize response to frontend TruckType shape
        const savedTruck: TruckType = {
          id: String(saved.id),
          name: saved.name,
          plateNumber: saved.plate_number || saved.plateNumber,
          model: saved.model,
          driver: saved.driver,
          fuelLevel: Number(saved.fuel_level || saved.fuelLevel || 100),
          loadCapacity: Number(saved.load_capacity || saved.loadCapacity || 0),
          fuelType: saved.fuel_type || saved.fuelType || "Diesel",
          status: saved.status || "available",
          lastMaintenance: saved.last_maintenance || saved.lastMaintenance || new Date().toISOString().slice(0,10),
        };
        addTruck(savedTruck);
      } else {
        // server returned error; fallback to local
        addTruck(truckToAdd);
      }
    } catch (err) {
      // network error or CORS - fallback to local storage behavior
      addTruck(truckToAdd);
    }
    setNewTruck({ name: "", plateNumber: "", model: "", driver: "", fuelLevel: 100, loadCapacity: undefined, fuelType: "Diesel", status: "available" });
    setIsAddTruckOpen(false);
    toast.success(`Truck ${truckToAdd.name} added successfully`);
    notifyToast({
      title: "New Truck Added",
      description: `${truckToAdd.name} (${truckToAdd.plateNumber}) has been added to the fleet`
    });
    addNotification({ title: "New Truck Added", message: `${truckToAdd.name} (${truckToAdd.plateNumber}) has been added to the fleet`, type: 'info', url: `/trucks/${newId}` });
  };

  const handleEditTruck = (truck: TruckType) => { setEditingTruck(truck); setIsEditTruckOpen(true); };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTruck) return;
    if (editingTruck.loadCapacity !== undefined && Number(editingTruck.loadCapacity) > 99) { toast.error("Capacity must be at most 2 digits (max 99)"); return; }
    const plateRegex = /^[A-Z]{3}-\d{4}$/;
    if (!plateRegex.test(editingTruck.plateNumber)) { toast.error("Plate number must be in format ABC-1234"); return; }
    if (editingTruck.status === "intransit" && (!editingTruck.driver || editingTruck.driver === "" || editingTruck.driver === "Unassigned")) { toast.error("Cannot mark 'In Transit' without an assigned driver"); return; }
    if (editingTruck.status === "available" && editingTruck.driver && editingTruck.driver !== "Unassigned") { toast.error("Cannot mark 'Available' while a driver is assigned"); return; }
    if (editingTruck.status === "maintenance" && editingTruck.driver && editingTruck.driver !== "Unassigned") { toast.error("Cannot mark 'Maintenance' while a driver is assigned"); return; }

    updateTruck(editingTruck);
    notifyToast({
      title: "Truck Status Updated",
      description: `${editingTruck.name} status changed to ${editingTruck.status}`
    });
    addNotification({ title: "Truck Status Updated", message: `${editingTruck.name} status changed to ${editingTruck.status}`, type: 'info' });
    try {
      const raw = localStorage.getItem("drivers");
      const hasCompletedTripForTruck = (truckId: string) => { try { const tRaw = localStorage.getItem('trips'); if (!tRaw) return false; const tArr = JSON.parse(tRaw) as any[]; return tArr.some((tr) => String(tr.truckId) === String(truckId) && tr.status === 'completed'); } catch (e) { return false; } };
      if (raw) {
        const arr = JSON.parse(raw) as any[];
        const updated = arr.map((d) => {
          const isAssignedToThisTruck = d.assignedVehicle === editingTruck.id;
          const nameMatches = d.name === editingTruck.driver;
          if (editingTruck.status === "intransit" && (isAssignedToThisTruck || nameMatches)) return { ...d, status: "driving", assignedVehicle: editingTruck.id };
          if (!editingTruck || editingTruck.status !== "intransit") {
            if (isAssignedToThisTruck) return { ...d, status: "assigned", assignedVehicle: editingTruck.id };
            if (nameMatches && d.status === "driving" && d.assignedVehicle !== editingTruck.id) { if (hasCompletedTripForTruck(editingTruck.id)) return d; return { ...d, status: "available" }; }
          }
          return d;
        });
        localStorage.setItem("drivers", JSON.stringify(updated));
      }
    } catch (e) {}

    toast.success(`Truck ${editingTruck.name} updated successfully`);
    setIsEditTruckOpen(false);
    setEditingTruck(null);
  };

  const handleDeleteTruck = (truckId: string) => {
    try { const rawTrips = localStorage.getItem('trips'); if (rawTrips) { const tripsArr = JSON.parse(rawTrips) as any[]; const blocked = tripsArr.some((t) => String(t.truckId) === String(truckId) && t.status !== 'completed' && t.status !== 'cancelled'); if (blocked) { toast.error('Cannot delete truck while it has scheduled or active trips.'); return; } } } catch (e) {}
    try { const raw = localStorage.getItem("drivers"); if (raw) { const arr = JSON.parse(raw) as any[]; const updated = arr.map((d) => (d.assignedVehicle === truckId ? { ...d, assignedVehicle: null, status: "available" } : d)); localStorage.setItem("drivers", JSON.stringify(updated)); } } catch (e) {}
    deleteTruck(truckId);
    toast.success(`Truck ${truckId} deleted successfully`);
    notifyToast({
      title: "Truck Removed",
      description: `Truck ${truckId} has been removed from the fleet`
    });
  };

  const filteredTrucks = trucks.filter((truck) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (truck.name || "").toLowerCase().includes(term) || (truck.plateNumber || "").toLowerCase().includes(term) || (truck.driver || "").toLowerCase().includes(term);
    const matchesStatus = statusFilter === "all" || truck.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredTrucks.length / pageSize));
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [totalPages]);
  const visibleTrucks = filteredTrucks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const resetNewTruck = () => setNewTruck({ name: "", plateNumber: "", model: "", driver: "", fuelLevel: 100, loadCapacity: undefined, fuelType: "Diesel", status: "available" });
  const handleAddOpenChange = (open: boolean) => { setIsAddTruckOpen(open); resetNewTruck(); };

  return (
    <Card>
      <CardHeader className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Truck Management</CardTitle>
            <CardDescription>Manage your fleet of vehicles and their status</CardDescription>
          </div>
          <Dialog open={isAddTruckOpen} onOpenChange={handleAddOpenChange}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2"><PlusCircle className="h-4 w-4" /><span>Add Truck</span></Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Truck</DialogTitle>
                <DialogDescription>Enter the details of the new truck below.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddTruck}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input id="name" name="name" value={newTruck.name} onChange={(e) => setNewTruck({ ...newTruck, name: e.target.value })} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="plateNumber" className="text-right">Plate Number</Label>
                    <Input id="plateNumber" name="plateNumber" value={newTruck.plateNumber} onChange={handlePlateChange} placeholder="ABC-1234" pattern="[A-Z]{3}-[0-9]{4}" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="model" className="text-right">Model</Label>
                    <Input id="model" name="model" value={newTruck.model} onChange={(e) => setNewTruck({ ...newTruck, model: e.target.value })} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="loadCapacity" className="text-right">Capacity</Label>
                    <Input id="loadCapacity" name="loadCapacity" type="number" step="0.1" placeholder="ton/s" value={newTruck.loadCapacity !== undefined ? String(newTruck.loadCapacity) : ''} onChange={(e) => { const v = e.target.value; if (v === '') setNewTruck({ ...newTruck, loadCapacity: undefined }); else setNewTruck({ ...newTruck, loadCapacity: sanitizeCapacity(v) }); }} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="fuelType" className="text-right">Fuel Type</Label>
                    <Select value={newTruck.fuelType} onValueChange={(v) => setNewTruck({ ...newTruck, fuelType: v })}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select fuel type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Diesel">Diesel</SelectItem>
                        <SelectItem value="Petrol">Petrol</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="fuelLevel" className="text-right">Fuel Level</Label>
                    <div className="col-span-3">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Slider value={[Number(newTruck.fuelLevel)]} onValueChange={(val) => setNewTruck({ ...newTruck, fuelLevel: Number(val[0]) })} min={0} max={100} step={1} />
                        </div>
                        <div className="w-14 text-right text-sm font-medium">{newTruck.fuelLevel}%</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status" className="text-right">Status</Label>
                    <Select value={newTruck.status} onValueChange={(value) => setNewTruck({ ...newTruck, status: value })}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Add Truck</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Input placeholder="Search trucks..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            <Truck className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="intransit">In Transit</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Vehicle Name</TableHead>
                <TableHead>Plate Number</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Fuel Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleTrucks.length > 0 ? (
                visibleTrucks.map((truck) => (
                  <TruckTableRow key={truck.id} truck={truck} onDelete={(id) => { setTruckToDelete(id); setIsDeleteConfirmOpen(true); }} />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No trucks found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4">
          <DriverListPagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => setCurrentPage(p)} />
        </div>
      </CardContent>

      {/* Edit Truck Dialog */}
      <Dialog open={isEditTruckOpen} onOpenChange={setIsEditTruckOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Truck</DialogTitle>
            <DialogDescription>Update the truck details. Click save when you're done.</DialogDescription>
          </DialogHeader>
          {editingTruck && (
            <form onSubmit={handleSaveEdit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">Name</Label>
                  <Input id="edit-name" value={editingTruck.name} onChange={(e) => setEditingTruck({ ...editingTruck, name: e.target.value })} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-plateNumber" className="text-right">Plate Number</Label>
                  <Input id="edit-plateNumber" value={editingTruck.plateNumber} onChange={(e) => setEditingTruck({ ...editingTruck, plateNumber: formatPlate(e.target.value) })} placeholder="ABC-1234" pattern="[A-Z]{3}-[0-9]{4}" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-model" className="text-right">Model</Label>
                  <Input id="edit-model" value={editingTruck.model} onChange={(e) => setEditingTruck({ ...editingTruck, model: e.target.value })} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-loadCapacity" className="text-right">Capacity</Label>
                  <Input id="edit-loadCapacity" type="number" step="0.1" placeholder="ton/s" value={editingTruck.loadCapacity !== undefined ? String(editingTruck.loadCapacity) : ''} onChange={(e) => { const v = e.target.value; if (v === '') setEditingTruck({ ...editingTruck, loadCapacity: undefined }); else setEditingTruck({ ...editingTruck, loadCapacity: sanitizeCapacity(v) }); }} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-fuelType" className="text-right">Fuel Type</Label>
                  <Select value={editingTruck.fuelType || "Diesel"} onValueChange={(v) => setEditingTruck({ ...editingTruck, fuelType: v })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                      <SelectItem value="Petrol">Petrol</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-status" className="text-right">Status</Label>
                  {(editingTruck.status === "intransit" || editingTruck.status === "assigned") ? (
                    <div className="col-span-3 pointer-events-none" aria-hidden>
                      <StatusBadge status={editingTruck.status} className="pointer-events-none select-none" />
                    </div>
                  ) : (
                    <Select value={editingTruck.status} onValueChange={(value) => setEditingTruck({ ...editingTruck, status: value as TruckType["status"] })}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-fuelLevel" className="text-right">Fuel Level</Label>
                  <div className="col-span-3">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Slider value={[Number(editingTruck.fuelLevel)]} onValueChange={(val) => setEditingTruck({ ...editingTruck, fuelLevel: Number(val[0]) })} min={0} max={100} step={1} />
                      </div>
                      <div className="w-14 text-right text-sm font-medium">{editingTruck.fuelLevel}%</div>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsEditTruckOpen(false)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Truck</DialogTitle>
            <DialogDescription>Are you sure you want to delete this truck? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDeleteConfirmOpen(false); setTruckToDelete(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={() => { if (truckToDelete) handleDeleteTruck(truckToDelete); setIsDeleteConfirmOpen(false); setTruckToDelete(null); }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default TruckList;
