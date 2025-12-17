
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { DestinationType } from "@/pages/Destinations";

const DestinationList = ({ destinations }: { destinations: DestinationType[] }) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search destinations..."
            className="pl-8"
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="warehouse">Warehouse</SelectItem>
            <SelectItem value="retail">Retail</SelectItem>
            <SelectItem value="distribution">Distribution</SelectItem>
            <SelectItem value="manufacturing">Manufacturing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {destinations.map((destination) => (
          <Link
            key={destination.id}
            to={`/destinations/${destination.id}`}
            className="transition-transform hover:scale-[1.01]"
          >
            <Card>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold">{destination.name}</h3>
                  <span className="rounded bg-primary/10 px-2 py-1 text-xs capitalize">
                    {destination.type}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {destination.address}, {destination.city}, {destination.state}
                </p>
                {/* metrics removed: showing only basic info to keep UI clean */}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DestinationList;
