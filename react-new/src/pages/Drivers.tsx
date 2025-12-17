
import { useParams } from "react-router-dom";
import DriverList from "@/components/drivers/DriverList";
import DriverDetails from "@/components/drivers/DriverDetails";
import { useState, useEffect } from "react";

// Type definition
export type DriverType = {
  id: string;
  name: string;
  licenseNumber: string;
  email: string;
  phone: string;
  // 'assigned' means a vehicle is assigned but driver is not currently driving
  status: "available" | "assigned" | "driving" | "off-duty" | "inactive";
  assignedVehicle: string | null;
  licenseType?: string;
  licenseExpiry?: string;
  dateOfBirth?: string;
  address?: string;
  // Employment/profile optional fields
  dateHired?: string; // ISO date
  employmentType?: string;
  department?: string;
  supervisor?: string;
  emergencyContact?: string;
};

// No seeded drivers — start empty so you can add your own
const mockDrivers: DriverType[] = [];

const Drivers = () => {
  console.log("Drivers page rendering");
  const { id } = useParams();
  const [selectedDriver, setSelectedDriver] = useState<DriverType | null>(null);
  const [drivers, setDrivers] = useState<DriverType[]>(() => {
    try {
      const raw = localStorage.getItem("drivers");
      const arr = raw ? (JSON.parse(raw) as DriverType[]) : mockDrivers;
      // Remove any unwanted/legacy driver entries (development cleanup)
      const filtered = arr.filter((d) => !(d.id === "D-014" || d.name === "Ariane"));
      if (filtered.length !== arr.length) {
        try {
          localStorage.setItem("drivers", JSON.stringify(filtered));
          try { window.dispatchEvent(new Event("drivers-updated")); } catch (e) {}
        } catch (e) {
          // ignore storage errors
        }
      }
      return filtered;
    } catch (e) {
      return mockDrivers;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("drivers", JSON.stringify(drivers));
    } catch (e) {
      // ignore
    }
  }, [drivers]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate async data loading
    setIsLoading(true);
    setTimeout(() => {
      if (id) {
        const driver = drivers.find((d) => d.id === id);
        setSelectedDriver(driver || null);
      } else {
        setSelectedDriver(null);
      }
      setIsLoading(false);
    }, 100);
  }, [id, drivers]);

  // Listen for external updates to drivers in localStorage (e.g. schedule changes)
  useEffect(() => {
    const handler = () => {
      try {
        const raw = localStorage.getItem("drivers");
        const parsed = raw ? (JSON.parse(raw) as DriverType[]) : [];
        setDrivers(parsed);
      } catch (e) {
        // ignore
      }
    };

    const storageHandler = (e: StorageEvent) => {
      if (e.key === "drivers") handler();
    };

    const focusHandler = () => handler();

    window.addEventListener("drivers-updated", handler as EventListener);
    window.addEventListener("storage", storageHandler);
    window.addEventListener("focus", focusHandler);

    return () => {
      window.removeEventListener("drivers-updated", handler as EventListener);
      window.removeEventListener("storage", storageHandler);
      window.removeEventListener("focus", focusHandler);
    };
  }, [setDrivers]);

  

  // Edit handled within DriverList component

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 content-fade-in">
      {selectedDriver ? (
        <DriverDetails driver={selectedDriver} setDrivers={setDrivers} />
      ) : (
        <DriverList drivers={drivers} setDrivers={setDrivers} />
      )}
    </div>
  );
};

export default Drivers;
