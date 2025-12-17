import React, { createContext, useContext, useEffect, useState } from "react";
import { TruckType } from "@/types/truck";
import { mockTrucks } from "@/data/mockTrucks";
import { toast } from "@/hooks/use-toast";
import { useNotifications } from "@/contexts/NotificationContext";

type TruckContextType = {
  trucks: TruckType[];
  addTruck: (t: TruckType) => void;
  updateTruck: (t: TruckType) => void;
  deleteTruck: (id: string) => void;
};

const TruckContext = createContext<TruckContextType | undefined>(undefined);

export const TruckProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trucks, setTrucks] = useState<TruckType[]>(() => {
    try {
      const raw = localStorage.getItem("trucks");
      return raw ? (JSON.parse(raw) as TruckType[]) : mockTrucks;
    } catch (e) {
      return mockTrucks;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("trucks", JSON.stringify(trucks));
    } catch (e) {
      // ignore
    }
  }, [trucks]);

  const addTruck = (t: TruckType) => setTrucks((prev) => [t, ...prev]);
  const updateTruck = (t: TruckType) => {
    setTrucks((prev) => prev.map((p) => (p.id === t.id ? t : p)));
    
    // Check for low fuel after update
    if (t.fuelLevel <= 20 && t.status !== 'maintenance') {
      toast({
        title: "Low Fuel Alert",
        description: `${t.name} fuel level is at ${t.fuelLevel}%. Refueling recommended.`,
        variant: "destructive"
      });
    }
  };
  const deleteTruck = (id: string) => setTrucks((prev) => prev.filter((p) => p.id !== id));

  const { addNotification } = useNotifications();

  // Monitor for maintenance due and low fuel
  useEffect(() => {
    const checkAlerts = () => {
      trucks.forEach((truck) => {
        // Check for low fuel (below 20%)
        if (truck.fuelLevel <= 20 && truck.status !== 'maintenance') {
          const key = `fuel-alert-${truck.id}`;
          const lastAlert = sessionStorage.getItem(key);
          const now = Date.now();
          // Only show alert once per hour per truck
          if (!lastAlert || now - parseInt(lastAlert) > 3600000) {
            const fuelDesc = `${truck.name} (${truck.plateNumber}) fuel level is at ${truck.fuelLevel}%`;
            toast({
              title: "Low Fuel Alert",
              description: fuelDesc,
              variant: "destructive"
            });
            addNotification({ title: "Low Fuel Alert", message: fuelDesc, type: 'warning', url: `/trucks/${truck.id}` });
            sessionStorage.setItem(key, String(now));
          }
        }

        // Check for maintenance due (if lastMaintenance is more than 90 days ago)
        if (truck.lastMaintenance) {
          try {
            const lastDate = new Date(truck.lastMaintenance);
            const daysSince = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSince >= 90 && truck.status !== 'maintenance') {
              const key = `maint-alert-${truck.id}`;
              const lastAlert = sessionStorage.getItem(key);
              const now = Date.now();
              // Only show alert once per day per truck
              if (!lastAlert || now - parseInt(lastAlert) > 86400000) {
                const maintDesc = `${truck.name} is due for maintenance (last serviced ${daysSince} days ago)`;
                toast({
                  title: "Vehicle Maintenance Due",
                  description: maintDesc,
                });
                addNotification({ title: "Vehicle Maintenance Due", message: maintDesc, type: 'warning', url: `/trucks/${truck.id}` });
                sessionStorage.setItem(key, String(now));
              }
            }
          } catch (e) {
            // ignore date parsing errors
          }
        }
      });
    };

    // Check alerts every 5 minutes
    const interval = setInterval(checkAlerts, 300000);
    // Initial check after 10 seconds
    const timeout = setTimeout(checkAlerts, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [trucks]);

  return (
    <TruckContext.Provider value={{ trucks, addTruck, updateTruck, deleteTruck }}>
      {children}
    </TruckContext.Provider>
  );
};

export const useTruckContext = () => {
  const ctx = useContext(TruckContext);
  if (!ctx) throw new Error("useTruckContext must be used within TruckProvider");
  return ctx;
};
