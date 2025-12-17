
import {
  Truck,
  Users,
  MapPin,
  Calendar,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import StatusCard from "@/components/dashboard/StatusCard";
import {
  AreaChartComponent,
  BarChartComponent,
} from "@/components/dashboard/StatisticsChart";
import StatusBadge from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTruckContext } from "@/context/TruckContext";
import { useEffect, useState } from "react";
import { useNotifications } from "@/contexts/NotificationContext";
import { useNavigate } from "react-router-dom";
import type { DriverType } from "@/pages/Drivers";

const Index = () => {
  const { trucks } = useTruckContext();
  const [drivers, setDrivers] = useState<DriverType[]>([]);
  const [trips, setTrips] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('trips');
      return raw ? (JSON.parse(raw) as any[]) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    const handleStorage = (ev: StorageEvent) => {
      if (ev.key === 'trips') {
        try {
          const raw = ev.newValue;
          setTrips(raw ? (JSON.parse(raw) as any[]) : []);
        } catch (e) {
          setTrips([]);
        }
      }
    };

    const handleCustom = () => {
      try {
        const raw = localStorage.getItem('trips');
        setTrips(raw ? (JSON.parse(raw) as any[]) : []);
      } catch (e) {
        setTrips([]);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('trips-updated', handleCustom);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('trips-updated', handleCustom);
    };
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("drivers");
      setDrivers(raw ? (JSON.parse(raw) as DriverType[]) : []);
    } catch (e) {
      setDrivers([]);
    }
  }, []);

  const totalVehicles = Array.isArray(trucks) ? trucks.length : 0;
  const activeVehicles = Array.isArray(trucks)
    ? trucks.filter((t) => ["available", "assigned", "pending", "intransit"].includes(t.status)).length
    : 0;
  const activeDrivers = drivers.filter((d) => ["available", "assigned", "pending", "driving"].includes(d.status)).length;
  const inTransit = Array.isArray(trucks) ? trucks.filter((t) => t.status === "intransit").length : 0;
  const maintenance = Array.isArray(trucks) ? trucks.filter((t) => t.status === "maintenance").length : 0;
  const available = Array.isArray(trucks) ? trucks.filter((t) => t.status === "available").length : 0;

  // derive destination stats from trips in state
  let uniqueDestinations = 0;
  let destInTransit = 0;
  let destCompleted = 0;
  try {
    const destSet = new Set<string>();
    const inTransitSet = new Set<string>();
    const completedSet = new Set<string>();
    trips.forEach((tr) => {
      const dest = tr.destination || tr.dest || '';
      if (!dest) return;
      destSet.add(dest);
      if (tr.status === 'intransit') inTransitSet.add(dest);
      if (tr.status === 'completed') completedSet.add(dest);
    });
    uniqueDestinations = destSet.size;
    destInTransit = inTransitSet.size;
    destCompleted = completedSet.size;
  } catch (e) {
    uniqueDestinations = 0;
    destInTransit = 0;
    destCompleted = 0;
  }

  // derive scheduled trips counts from trips state
  let scheduledCount = 0;
  let inTransitTrips = 0;
  let completedTrips = 0;
  try {
    // Count all trips (completed, pending/future, intransit)
    scheduledCount = trips.filter((t) => !!t && (t.id || t.tripId)).length || trips.length;

    inTransitTrips = trips.filter((t) => String(t.status).toLowerCase() === 'intransit').length;
    completedTrips = trips.filter((t) => String(t.status).toLowerCase() === 'completed').length;
  } catch (e) {
    scheduledCount = 0;
    inTransitTrips = 0;
    completedTrips = 0;
  }

  const pct = (n: number) => (totalVehicles > 0 ? Math.round((n / totalVehicles) * 100) : 0);

  return (
    <div className="space-y-8 content-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatusCard
          title="Active Vehicles"
          value={String(activeVehicles)}
          icon={<Truck className="h-4 w-4" />}
          trend={{ value: totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0, positive: true }}
        />
        <StatusCard
          title="Active Drivers"
          value={String(activeDrivers)}
          icon={<Users className="h-4 w-4" />}
          trend={{ value: drivers.length > 0 ? Math.round((activeDrivers / drivers.length) * 100) : 0, positive: true }}
        />
        <StatusCard
          title="Destinations"
          value={String(uniqueDestinations)}
          icon={<MapPin className="h-4 w-4" />}
          trend={{ value: 24, positive: true }}
          description={`In Transit: ${destInTransit} • Completed: ${destCompleted}`}
        />
        <div role="button" tabIndex={0} onClick={() => navigate('/schedule')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/schedule'); }} className="cursor-pointer">
          <StatusCard
            title="Scheduled Trips"
            value={String(scheduledCount)}
            icon={<Calendar className="h-4 w-4" />}
            trend={{ value: 3, positive: false }}
            description={`In Transit: ${inTransitTrips} • Completed: ${completedTrips}`}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <AreaChartComponent />
          <BarChartComponent />
        </div>

        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>System notifications and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-72 overflow-y-auto">
                <RecentAlerts />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

  const RecentAlerts: React.FC = () => {
    const { notifications, markAsRead } = useNotifications();
    const navigate = useNavigate();

    const handleClick = (id: string, url?: string) => {
      try { markAsRead(id); } catch (e) {}
      if (url) {
        try { navigate(url); } catch (e) {}
      }
    };

    if (!notifications || notifications.length === 0) {
      return <div className="text-sm text-muted-foreground">No recent alerts.</div>;
    }

    return (
      <div className="space-y-2">
        {notifications.slice(0, 6).map((n) => (
          <div
            key={n.id}
            role="button"
            tabIndex={0}
            onClick={() => handleClick(n.id, n.url)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(n.id, n.url); }}
            className={`flex items-start space-x-3 p-3 rounded-md bg-card border transition-colors hover:bg-muted/50 cursor-pointer ${!n.read ? 'ring-2 ring-primary/10' : ''}`}
          >
            <div className={`flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center ${n.type === 'error' ? 'bg-red-100 text-red-600' : n.type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium truncate">{n.title}</span>
                <span className="text-xs text-muted-foreground">{new Date(n.timestamp).toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{n.message}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

const Alert = ({
  title,
  description,
  priority,
  time,
}: {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  time: string;
}) => {
  const priorityColor = {
    low: "bg-blue-500/10 text-blue-500",
    medium: "bg-amber-500/10 text-amber-500",
    high: "bg-red-500/10 text-red-500",
  };

  return (
    <div className="flex items-start space-x-3 p-3 rounded-md bg-card border transition-colors hover:bg-muted/50">
      <div
        className={`flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center ${priorityColor[priority]}`}
      >
        <AlertTriangle className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium truncate">{title}</span>
          <span className="text-xs text-muted-foreground">{time}</span>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};

export default Index;
