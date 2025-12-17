
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Truck, User, Check, X } from "lucide-react";
import type { DriverType } from "@/pages/Drivers";

export const getStatusBadge = (status: string) => {
  const statusConfig: Record<
    string,
    { color: string; label: string; icon: React.ReactNode }
  > = {
    available: {
      color: "bg-green-100 text-green-800 hover:bg-green-200",
      label: "Available",
      icon: <User className="h-3 w-3 mr-1" />,
    },
    driving: {
      color: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      label: "Driving",
      icon: <Truck className="h-3 w-3 mr-1" />,
    },
    intransit: {
      color: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      label: "In Transit",
      icon: <Truck className="h-3 w-3 mr-1" />,
    },
    assigned: {
      color: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200",
      label: "Assigned",
      icon: <Truck className="h-3 w-3 mr-1" />,
    },
    pending: {
      color: "bg-amber-100 text-amber-800 hover:bg-amber-200",
      label: "Pending",
      icon: null,
    },
    maintenance: {
      color: "bg-amber-100 text-amber-800 hover:bg-amber-200",
      label: "Maintenance",
      icon: null,
    },
    completed: {
      color: "bg-green-100 text-green-800 hover:bg-green-200",
      label: "Completed",
      icon: <Check className="h-3 w-3 mr-1" />,
    },
    cancelled: {
      color: "bg-red-100 text-red-800 hover:bg-red-200",
      label: "Cancelled",
      icon: <X className="h-3 w-3 mr-1" />,
    },
    "off-duty": {
      color: "bg-amber-100 text-amber-800 hover:bg-amber-200",
      label: "Off Duty",
      icon: null,
    },
    inactive: {
      color: "bg-slate-100 text-slate-800 hover:bg-slate-200",
      label: "Inactive",
      icon: null,
    },
  };

  // Treat legacy/placeholder 'inactive' as 'pending' for display consistency
  const displayStatus = status === 'inactive' ? 'pending' : status;
  const config = statusConfig[displayStatus] || statusConfig.inactive;

  return (
    <Badge
      variant="outline"
      className={`${config.color} border-none flex items-center`}
    >
      {config.icon}
      {config.label}
    </Badge>
  );
};

export const getVehicleBadge = (assignedVehicle: string | null) => {
  if (assignedVehicle) {
    return (
      <Badge variant="outline" className="bg-primary/10 text-primary border-none flex items-center">
        <Truck className="h-3 w-3 mr-1" />
        {assignedVehicle}
      </Badge>
    );
  }
  
  return (
    <span className="text-sm text-muted-foreground">
      Unassigned
    </span>
  );
};

export const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};
