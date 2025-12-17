
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTruckContext } from "@/context/TruckContext";
import { Cell } from "recharts";

// areaData will be computed from trips in localStorage (completed trips)

const barData = [
  {
    name: "Mon",
    available: 20,
    intransit: 15,
    maintenance: 5,
  },
  {
    name: "Tue",
    available: 18,
    intransit: 17,
    maintenance: 5,
  },
  {
    name: "Wed",
    available: 15,
    intransit: 20,
    maintenance: 5,
  },
  {
    name: "Thu",
    available: 22,
    intransit: 13,
    maintenance: 5,
  },
  {
    name: "Fri",
    available: 25,
    intransit: 10,
    maintenance: 5,
  },
  {
    name: "Sat",
    available: 28,
    intransit: 7,
    maintenance: 5,
  },
  {
    name: "Sun",
    available: 30,
    intransit: 5,
    maintenance: 5,
  },
];

export const AreaChartComponent = () => {
  const [timeRange, setTimeRange] = useState("weekly");
  const [areaData, setAreaData] = useState<Array<{ name: string; value: number }>>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('trips');
      const trips = raw ? (JSON.parse(raw) as any[]) : [];

      // normalize completed trips with a timestamp (use endTime if present, else startTime)
      const completed = trips
        .map((t) => ({ ...t, startTime: t.startTime ? new Date(t.startTime) : null, endTime: t.endTime ? new Date(t.endTime) : null }))
        .filter((t) => t.status === 'completed');

      const now = new Date();

      if (timeRange === 'weekly') {
        // last 7 days, labels Day names
        const labels: string[] = [];
        const counts: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(now.getDate() - i);
          const key = d.toLocaleDateString();
          labels.push(d.toLocaleDateString(undefined, { weekday: 'short' }));
          counts[key] = 0;
        }
        completed.forEach((t) => {
          const date = (t.endTime || t.startTime || new Date()).toLocaleDateString();
          if (date in counts) counts[date]++;
        });
        const data = Object.keys(counts).map((k, i) => ({ name: labels[i], value: counts[k] }));
        setAreaData(data);
      } else if (timeRange === 'monthly') {
        // last 30 days grouped by day (or 30 buckets)
        const counts: Record<string, number> = {};
        const labels: string[] = [];
        for (let i = 29; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(now.getDate() - i);
          const key = d.toLocaleDateString();
          labels.push(d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
          counts[key] = 0;
        }
        completed.forEach((t) => {
          const date = (t.endTime || t.startTime || new Date()).toLocaleDateString();
          if (date in counts) counts[date]++;
        });
        const data = Object.keys(counts).map((k, i) => ({ name: labels[i], value: counts[k] }));
        setAreaData(data);
      } else {
        // yearly: counts per month for current year
        const counts: number[] = new Array(12).fill(0);
        completed.forEach((t) => {
          const d = t.endTime || t.startTime || new Date();
          const dt = new Date(d);
          if (dt.getFullYear() === now.getFullYear()) {
            counts[dt.getMonth()]++;
          }
        });
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const data = months.map((m, i) => ({ name: m, value: counts[i] }));
        setAreaData(data);
      }
    } catch (e) {
      setAreaData([]);
    }
  }, [timeRange]);

  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-row items-center justify-between pb-0">
        <div>
          <CardTitle>Trip Analytics</CardTitle>
          <CardDescription>Completed trips over time</CardDescription>
        </div>
        <Select
          value={timeRange}
          onValueChange={setTimeRange}
          defaultValue="weekly"
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={areaData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
                dy={10}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
                dx={-10}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export const BarChartComponent = () => {
  const { trucks } = useTruckContext();

  const totalTrucks = Array.isArray(trucks) ? trucks.length : 0;
  const available = Array.isArray(trucks)
    ? trucks.filter((t) => t.status === "available").length
    : 0;
  const intransit = Array.isArray(trucks)
    ? trucks.filter((t) => t.status === "intransit").length
    : 0;
  const maintenance = Array.isArray(trucks)
    ? trucks.filter((t) => t.status === "maintenance").length
    : 0;
  const pending = Array.isArray(trucks)
    ? trucks.filter((t) => t.status === "pending").length
    : 0;

  const data = [
    { name: "Available", value: available, color: "hsl(var(--status-available))" },
    { name: "Pending", value: pending, color: "hsl(var(--status-pending, 48 89% 54%))" },
    { name: "In Transit", value: intransit, color: "hsl(var(--status-intransit))" },
    { name: "Maintenance", value: maintenance, color: "hsl(var(--status-maintenance))" },
  ];

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Fleet Status</CardTitle>
        <CardDescription>Current fleet status counts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              barSize={22}
              barCategoryGap="40%"
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
                dy={10}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
                dx={-10}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={28}>
                {data.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
