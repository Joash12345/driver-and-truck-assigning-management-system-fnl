import { useNavigate } from "react-router-dom";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Trash, User } from "lucide-react";
import type { TruckType } from "@/types/truck";
import { getStatusBadge } from "@/components/drivers/utils/driverStatusUtils";

interface Props {
  truck: TruckType;
  onDelete: (truckId: string) => void;
}

const TruckTableRow: React.FC<Props> = ({ truck, onDelete }) => {
  const navigate = useNavigate();

  // determine if this truck is present in any scheduled/active trips
  let isScheduled = false;
  try {
    const raw = localStorage.getItem('trips');
    if (raw) {
      const arr = JSON.parse(raw) as any[];
      isScheduled = arr.some((t) => String(t.truckId) === String(truck.id) && t.status !== 'completed' && t.status !== 'cancelled');
    }
  } catch (e) {
    isScheduled = false;
  }

  const disabled = truck.status === 'intransit' || isScheduled;
  const title = isScheduled ? 'Cannot delete: truck is scheduled' : (truck.status === 'intransit' ? 'Cannot delete while In Transit' : 'Delete truck');

  const displayStatus = (truck.status === 'assigned' && (!truck.driver || truck.driver === 'Unassigned')) ? 'available' : truck.status;

  // try to resolve assigned driver info
  const driverInfo = (() => {
    try {
      const raw = localStorage.getItem('drivers');
      if (!raw) return null;
      const arr = JSON.parse(raw) as any[];
      const found = arr.find((d) => d.assignedVehicle === truck.id || d.name === truck.driver || d.id === truck.driver);
      if (!found) return null;
      return found;
    } catch (e) {
      return null;
    }
  })();

  return (
    <TableRow
      key={truck.id}
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => navigate(`/trucks/${truck.id}`)}
    >
      <TableCell>
        <div className="flex items-center h-full">
          <span className="text-sm text-muted-foreground opacity-70">{truck.id}</span>
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-3 h-full">
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{truck.name}</div>
          </div>
        </div>
      </TableCell>

      <TableCell>{truck.plateNumber}</TableCell>

      <TableCell>
        {driverInfo ? (
          <div className="text-sm">
            <div className="font-medium">{driverInfo.name}</div>
            <div className="flex flex-col gap-1 text-xs text-muted-foreground mt-1">
              <div className="flex items-center">
                <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
                <span>{driverInfo.email ?? '—'}</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                <span>{driverInfo.phone ?? '—'}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">{displayStatus === 'available' ? 'Unassigned' : (truck.driver || 'Unassigned')}</div>
        )}
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
            <div className={`h-full ${truck.fuelLevel > 70 ? 'bg-status-available' : truck.fuelLevel > 30 ? 'bg-status-pending' : 'bg-status-maintenance'}`} style={{ width: `${truck.fuelLevel}%` }} />
          </div>
          <span className="text-xs font-medium">{truck.fuelLevel}%</span>
        </div>
      </TableCell>

      <TableCell>
        {getStatusBadge(displayStatus)}
      </TableCell>

      <TableCell className="text-right">
        <Button
          variant="destructive"
          size="sm"
          title={title}
          aria-label={`Delete truck ${truck.id}`}
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            if (disabled) return;
            onDelete(truck.id);
          }}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default TruckTableRow;
