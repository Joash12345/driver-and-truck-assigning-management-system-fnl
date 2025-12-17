
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatusCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: {
    value: number;
    positive: boolean;
  };
  description?: string;
  className?: string;
}

export const StatusCard = ({
  title,
  value,
  icon,
  trend,
  description,
  className,
}: StatusCardProps) => {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-8 w-8 flex items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p
            className={cn(
              "text-xs flex items-center mt-1",
              trend.positive
                ? "text-status-available"
                : "text-status-maintenance"
            )}
          >
            <span
              className={cn(
                "mr-1 text-sm",
                trend.positive ? "rotate-0" : "rotate-180"
              )}
            >
              ↑
            </span>
            {trend.value}%{" "}
            <span className="text-muted-foreground ml-1">from last month</span>
          </p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatusCard;
