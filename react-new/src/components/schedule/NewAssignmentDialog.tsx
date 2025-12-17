
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MapPin } from 'lucide-react';
import { useTruckContext } from '@/context/TruckContext';
// removed mockDrivers import (driver select removed)
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

interface NewAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: any) => void;
  usedTruckIds?: string[];
  initialData?: any;
  onDelete?: (id: string) => void;
}

const LocationPicker: React.FC<{
  value?: LocationData;
  onChange: (loc: LocationData) => void;
  placeholder?: string;
}> = ({ value, onChange }) => {
  const ClickSelector: React.FC = () => {
    useMapEvents({
      click(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        // perform reverse geocoding via Nominatim
        (async () => {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
            if (!res.ok) throw new Error('geocode failed');
            const data = await res.json();
            const address = data.display_name || fallback;
            onChange({ lat, lng, address });
          } catch (err) {
            onChange({ lat, lng, address: fallback });
          }
        })();
      },
    });
    return value ? <Marker position={[value.lat, value.lng]} /> : null;
  };

  const WheelHandler: React.FC = () => {
    const map = useMapEvents({});
    useEffect(() => {
      const container = map.getContainer();
      if (!container) return;
      const onWheel = (e: WheelEvent) => {
        // require Ctrl key for zooming
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
    <div style={{ height: 300 }} className="rounded-md overflow-hidden">
      <MapContainer scrollWheelZoom={false} center={value ? [value.lat, value.lng] : [8.0, 125.0]} zoom={value ? 12 : 4} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        <ClickSelector />
        <WheelHandler />
      </MapContainer>
    </div>
  );
};

export default function NewAssignmentDialog({ open, onOpenChange, onSubmit, usedTruckIds, initialData, onDelete }: NewAssignmentDialogProps) {
  const [origin, setOrigin] = useState<LocationData | undefined>();
  const [destination, setDestination] = useState<LocationData | undefined>();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [activeLocationPicker, setActiveLocationPicker] = useState<'origin' | 'destination'>('origin');
  const [formData, setFormData] = useState({
    truckId: '',
    departureTime: '',
    cargo: '',
    cargoTons: '',
    notes: '',
  });

  // Prefill when editing
  useEffect(() => {
    if (open && initialData) {
      setFormData({
        truckId: initialData.truckId || '',
        departureTime: initialData.startTime ? new Date(initialData.startTime).toISOString().slice(0, 16) : (initialData.departureTime || ''),
        cargo: initialData.cargo || '',
        cargoTons: initialData.cargoTons || '',
        notes: initialData.notes || '',
      });

      if (initialData.originLat && initialData.originLng) {
        setOrigin({ lat: initialData.originLat, lng: initialData.originLng, address: initialData.origin || '' });
      } else if (initialData.origin) {
        setOrigin({ lat: 0, lng: 0, address: initialData.origin });
      }

      if (initialData.destLat && initialData.destLng) {
        setDestination({ lat: initialData.destLat, lng: initialData.destLng, address: initialData.destination || '' });
      } else if (initialData.destination) {
        setDestination({ lat: 0, lng: 0, address: initialData.destination });
      }
    }

    if (!open) {
      setOrigin(undefined);
      setDestination(undefined);
      setFormData({ truckId: '', departureTime: '', cargo: '', cargoTons: '', notes: '' });
    }
  }, [open, initialData]);

  const handleLocationChange = (location: LocationData) => {
    if (activeLocationPicker === 'origin') setOrigin(location);
    else setDestination(location);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!origin || !destination) {
      toast.error('Please select both origin and destination on the map');
      return;
    }

    if (!formData.truckId || !formData.departureTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    // cargo description is required for new schedules
    if (!formData.cargo || String(formData.cargo).trim() === '') {
      toast.error('Please provide a cargo description');
      return;
    }

    // Validate cargoTons against selected truck capacity
    const selectedTruck = trucks.find((t: any) => String(t.id) === String(formData.truckId));
    const cargoNum = Number(formData.cargoTons || 0);
    if (selectedTruck && typeof selectedTruck.loadCapacity === 'number') {
      if (!Number.isNaN(cargoNum) && cargoNum > Number(selectedTruck.loadCapacity)) {
        toast.error(`Cargo exceeds vehicle capacity (${selectedTruck.loadCapacity} ton/s)`);
        return;
      }
    }

    const payload = {
      id: initialData?.id,
      origin,
      destination,
      ...formData,
    };

    toast.success('Schedule created successfully!');
    onOpenChange(false);
    setOrigin(undefined);
    setDestination(undefined);
    setFormData({ truckId: '', departureTime: '', cargo: '', cargoTons: '', notes: '' });

    if (onSubmit) onSubmit(payload);
  };

  // Use trucks from TruckContext (persisted in localStorage)
  const { trucks } = useTruckContext();
  const usedSet = new Set((usedTruckIds || []).map((s) => String(s)));

  // Read drivers from localStorage to check assignedVehicle mapping
  const driversFromStorage: any[] = (() => {
    try {
      const raw = localStorage.getItem('drivers');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  })();

  const availableTrucks = trucks.filter((t: any) => {
    // Allow the truck being edited so the user can keep it selected
    if (initialData && String(t.id) === String(initialData.truckId)) return true;

    // Exclude trucks already used in pending/intransit assignments
    if (usedSet.has(String(t.id))) return false;

    // Only include trucks that are in 'assigned' status and have a real driver
    // (exclude placeholder/unassigned drivers)
    const hasDriver = t.driver && String(t.driver).trim() !== '' && String(t.driver) !== 'Unassigned';
    return String(t.status) === 'assigned' && hasDriver;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Schedule' : 'Create New Schedule'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Select Locations</h3>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant={activeLocationPicker === 'origin' ? 'default' : 'outline'} size="sm" onClick={() => setActiveLocationPicker('origin')}>Set Origin</Button>
              <Button type="button" variant={activeLocationPicker === 'destination' ? 'default' : 'outline'} size="sm" onClick={() => setActiveLocationPicker('destination')}>Set Destination</Button>
            </div>

            <LocationPicker value={activeLocationPicker === 'origin' ? origin : destination} onChange={handleLocationChange} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="origin">Origin Address</Label>
                <Input id="origin" value={origin?.address || ''} readOnly placeholder="Click map to select origin" className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">Destination Address</Label>
                <Input id="destination" value={destination?.address || ''} readOnly placeholder="Click map to select destination" className="bg-muted" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="truck">Truck</Label>
              <Select value={formData.truckId} onValueChange={(value) => setFormData({ ...formData, truckId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select truck" />
                </SelectTrigger>
                <SelectContent>
                  {availableTrucks.map((truck: any) => (
                    <SelectItem key={truck.id} value={truck.id}>
                      {`${truck.id} - ${truck.name || '-'}${truck.plateNumber ? `(${truck.plateNumber})` : ''}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cargoTons">Cargo ton/s</Label>
              <Input
                id="cargoTons"
                type="number"
                min={0}
                max={99}
                value={formData.cargoTons}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  const trimmed = raw.slice(0, 2);
                  setFormData({ ...formData, cargoTons: trimmed });
                }}
                placeholder="e.g., 10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departureTime">Departure Time</Label>
              <Input id="departureTime" type="datetime-local" value={formData.departureTime} onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo Description</Label>
              <Input id="cargo" value={formData.cargo} onChange={(e) => setFormData({ ...formData, cargo: e.target.value })} placeholder="e.g., Electronics - 15 pallets" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Any special instructions..." rows={3} />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            {initialData?.id && onDelete && (
              <>
                <Button type="button" variant="destructive" onClick={() => setIsDeleteConfirmOpen(true)}>
                  Delete
                </Button>
                <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Delete Schedule</DialogTitle>
                      <DialogDescription>Are you sure you want to delete this schedule? This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          if (initialData?.id && onDelete) onDelete(initialData.id);
                          setIsDeleteConfirmOpen(false);
                          onOpenChange(false);
                        }}
                      >
                        Delete
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
            <Button type="submit">{initialData ? 'Save Changes' : 'Create Schedule'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
