import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Pos = { lat: number; lng: number };

const ClickSelector: React.FC<{ initial?: Pos; onChange: (p: Pos) => void }> = ({ initial, onChange }) => {
  const [pos, setPos] = useState<Pos | null>(initial || null);
  useMapEvents({
    click(e) {
      const p = { lat: e.latlng.lat, lng: e.latlng.lng };
      setPos(p);
      onChange(p);
    },
  });
  return pos ? <Marker position={[pos.lat, pos.lng]} /> : null;
};

const MapPinDialogLeaflet: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (lat: number, lng: number) => void;
  initialLocation?: Pos;
  title?: string;
}> = ({ isOpen, onClose, onLocationSelect, initialLocation, title = "Pick location" }) => {
  const [selected, setSelected] = useState<Pos | undefined>(initialLocation);

  useEffect(() => {
    setSelected(initialLocation);
  }, [initialLocation, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div style={{ height: 480 }}>
          <MapContainer center={initialLocation ? [initialLocation.lat, initialLocation.lng] : [8.0, 125.0]} zoom={initialLocation ? 12 : 5} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
            <ClickSelector initial={initialLocation} onChange={(p) => setSelected(p)} />
          </MapContainer>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { if (selected) { onLocationSelect(selected.lat, selected.lng); } }}>Select location</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MapPinDialogLeaflet;
