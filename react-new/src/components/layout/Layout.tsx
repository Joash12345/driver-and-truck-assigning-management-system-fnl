
import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import AppSidebar from "./Sidebar";
import Header from "./Header";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/SidebarContext";
import { SidebarProvider } from "@/components/ui/sidebar";

const Layout = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-muted-foreground text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const { expanded } = useSidebar();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className={cn("flex-1 flex flex-col transition-all duration-300", expanded ? "ml-56" : "ml-16")}>
          <Header />
          <main className={cn("flex-1 overflow-auto transition-padding duration-300", expanded ? "p-6" : "p-4")}>
            <div
              className={cn(
                expanded ? "mx-auto max-w-7xl" : "mx-0 max-w-full",
                "space-y-6 page-transition"
              )}
            >
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
