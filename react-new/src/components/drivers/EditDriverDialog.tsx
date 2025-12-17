import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatLicense } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import type { DriverType } from "@/pages/Drivers";

interface EditDriverDialogProps {
  driver: DriverType | null;
  open: boolean;
  onClose: () => void;
  onSave: (driver: DriverType) => void;
}

export default function EditDriverDialog({ driver, open, onClose, onSave }: EditDriverDialogProps) {
  const [form, setForm] = useState<DriverType>(driver as DriverType);

  useEffect(() => {
    if (driver) {
      console.log("EditDriverDialog received driver:", driver);
      setForm(driver);
    }
  }, [driver]);

  if (!driver) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Driver</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Driver Name"
          />
          <Input
            value={form.licenseNumber}
            onChange={(e) => setForm({ ...form, licenseNumber: formatLicense(e.target.value) })}
            placeholder="License"
            inputMode="numeric"
            pattern="^\d{4}-\d{3}-\d{5}$"
            onKeyDown={(e) => {
              const allowed = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End"];
              if (allowed.includes(e.key)) return;
              if (!/^[0-9]$/.test(e.key)) {
                e.preventDefault();
                return;
              }
              const currentDigits = (form?.licenseNumber || "").replace(/\D/g, "").length;
              if (currentDigits >= 12) e.preventDefault();
            }}
            onPaste={(e: any) => {
              const paste = e.clipboardData.getData("Text") || "";
              const digits = paste.replace(/\D/g, "").slice(0, 12);
              e.preventDefault();
              setForm({ ...form, licenseNumber: formatLicense(digits) });
            }}
          />
        </div>

        <Button onClick={() => { console.log("EditDriverDialog onSave", form); onSave(form); }} className="mt-4 w-full">
          Save Changes
        </Button>
      </DialogContent>
    </Dialog>
  );
}
