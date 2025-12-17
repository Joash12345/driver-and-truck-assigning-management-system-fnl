export type TruckType = {
  id: string;
  name: string;
  plateNumber: string;
  model: string;
  driver: string;
  fuelLevel: number;
  loadCapacity?: number;
  fuelType?: "Diesel" | "Petrol" | string;
  status: "available" | "assigned" | "intransit" | "pending" | "maintenance";
  lastMaintenance: string;
};
