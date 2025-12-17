
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DriverType } from "@/pages/Drivers";
import DriverTableRow from "./DriverTableRow";

interface DriverTableProps {
  drivers: DriverType[];
  onEdit: (driver: DriverType) => void;
  onDelete: (driverId: string) => void;
}

const DriverTable = ({ drivers, onEdit, onDelete }: DriverTableProps) => {
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead>License Number</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Assigned Vehicle</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drivers.length > 0 ? (
            drivers.map((driver) => (
              <DriverTableRow key={driver.id} driver={driver} onEdit={onEdit} onDelete={onDelete} />
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={7}
                className="h-24 text-center text-muted-foreground"
              >
                No drivers found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default DriverTable;
