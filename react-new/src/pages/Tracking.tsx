import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import TrackingMap from "@/components/tracking/TrackingMap";

const Tracking: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">GPS demo</h1>
          <p className="text-sm text-muted-foreground">GPS demo and map view for trucks and drivers.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Map</CardTitle>
          <CardDescription>Interactive map displaying trucks and their locations.</CardDescription>
        </CardHeader>
        <CardContent>
          <TrackingMap />
        </CardContent>
      </Card>
    </div>
  );
};

export default Tracking;
