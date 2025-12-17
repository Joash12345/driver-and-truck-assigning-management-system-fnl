
import React from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusType = "available" | "intransit" | "pending" | "maintenance" | "assigned";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<
  StatusType,
  { label: string; className: string; icon?: React.ReactNode }
> = {
  available: {
    label: "Available",
    className: "status-badge-available",
  },
  intransit: {
    label: "In Transit",
    className: "status-badge-intransit",
  },
  pending: {
    label: "Pending",
    className: "status-badge-pending",
  },
  maintenance: {
    label: "Maintenance",
    className: "status-badge-maintenance",
  },
  assigned: {
    label: "Assigned",
    className: "status-badge-assigned",
    icon: <User className="h-3 w-3 mr-1" />,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
}) => {
  const config = statusConfig[status];

  return (
    <span className={cn("status-badge", config.className, className)}>
      {config.icon}
      {config.label}
    </span>
  );
};

export default StatusBadge;
