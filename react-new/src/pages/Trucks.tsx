
import { useParams } from "react-router-dom";
import TruckList from "@/components/trucks/TruckList";
import TruckDetails from "@/components/trucks/TruckDetails";
import { useMemo } from "react";
import type { TruckType } from "@/types/truck";
import { useTruckContext } from "@/context/TruckContext";

const Trucks = () => {
  const { id } = useParams();
  const { trucks } = useTruckContext();

  const selectedTruck = useMemo(() => {
    if (!id) return null;
    return trucks.find((t) => t.id === id) || null;
  }, [id, trucks]);

  return (
    <div className="space-y-8 content-fade-in">
      {selectedTruck ? <TruckDetails truck={selectedTruck} /> : <TruckList />}
    </div>
  );
};

export default Trucks;
