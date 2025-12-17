
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface DriverListFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
}

const DriverListFilters = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
}: DriverListFiltersProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Input
          placeholder="Search drivers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
      </div>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="available">Available</SelectItem>
          <SelectItem value="driving">Driving</SelectItem>
          <SelectItem value="assigned">Assigned</SelectItem>
          <SelectItem value="off-duty">Off Duty</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default DriverListFilters;
