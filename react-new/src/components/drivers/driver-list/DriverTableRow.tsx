
import { useNavigate } from "react-router-dom";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Trash } from "lucide-react";
import type { DriverType } from "@/pages/Drivers";
import { getStatusBadge } from "../utils/driverStatusUtils";
import { useTruckContext } from "@/context/TruckContext";

interface DriverTableRowProps {
  driver: DriverType;
  onEdit: (driver: DriverType) => void;
  onDelete: (driverId: string) => void;
}

const DriverTableRow = ({ driver, onEdit, onDelete }: DriverTableRowProps) => {
  const navigate = useNavigate();
  // determine if driver appears in any scheduled/active trips
  let isScheduled = false;
  try {
    const raw = localStorage.getItem('trips');
    if (raw) {
      const arr = JSON.parse(raw) as any[];
      isScheduled = arr.some((t) => (String(t.driverId) === String(driver.id) || String(t.driver) === String(driver.id)) && t.status !== 'completed' && t.status !== 'cancelled');
    }
  } catch (e) {
    isScheduled = false;
  }

  return (
    <TableRow
      key={driver.id}
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => navigate(`/drivers/${driver.id}`)}
    >
      <TableCell>
        <div className="flex items-center h-12">
          <span className="text-sm text-muted-foreground">{driver.id}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center h-12">
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{driver.name}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>{driver.licenseNumber}</TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <div className="flex items-center text-xs">
            <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
            {driver.email}
          </div>
          <div className="flex items-center text-xs">
            <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
            {driver.phone}
          </div>
        </div>
      </TableCell>
      <TableCell>
        {driver.assignedVehicle ? (
          (() => {
            try {
              const { trucks } = useTruckContext();
              const t = trucks.find((x) => x.id === driver.assignedVehicle);
              if (t) {
                return (
                  <div className="text-sm">
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.id} — {t.plateNumber}</div>
                  </div>
                );
              }
            } catch (e) {}
            return <span className="text-sm font-mono">{driver.assignedVehicle}</span>;
          })()
        ) : (
          <span className="text-sm text-muted-foreground">Unassigned</span>
        )}
      </TableCell>
      <TableCell>{getStatusBadge(driver.status)}</TableCell>
      <TableCell className="text-right">
        <Button
          variant="destructive"
          size="sm"
          title={isScheduled ? 'Cannot delete: driver has scheduled trips' : (driver.status === 'driving' ? 'Cannot delete while Driving' : 'Delete driver')}
          aria-label={`Delete driver ${driver.id}`}
          disabled={driver.status === 'driving' || isScheduled}
          onClick={(e) => {
            e.stopPropagation();
            if (driver.status === 'driving' || isScheduled) return;
            onDelete(driver.id);
          }}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default DriverTableRow;
