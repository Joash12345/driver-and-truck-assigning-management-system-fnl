
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ChevronLeft, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md px-6">
        <div className="flex justify-center mb-6">
          <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
            <AlertTriangle className="h-12 w-12 text-primary" />
          </div>
        </div>
        <h1 className="text-5xl font-bold mb-4">404</h1>
        <p className="text-xl text-foreground mb-2">Page Not Found</p>
        <p className="text-muted-foreground mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Go Back</span>
          </Button>
          <Button className="gap-2" onClick={() => navigate("/")}>
            <Home className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
