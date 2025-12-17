
import type { DriverType } from "@/pages/Drivers";

// No seeded drivers — start empty so you can add your own
export const mockDrivers: DriverType[] = [];

// Filter drivers based on search term and status filter
export const filterDrivers = (searchTerm: string, statusFilter: string) => {
  return mockDrivers.filter((driver) => {
    const matchesSearch =
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || driver.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
};
