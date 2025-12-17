import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import Layout from "./components/layout/Layout";
import Index from "./pages/Index";
import Trucks from "./pages/Trucks";
import Drivers from "./pages/Drivers";
import Destinations from "./pages/Destinations";
import Schedule from "./pages/Schedule";
import Tracking from "./pages/Tracking";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";

// Create a new QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  console.log("App rendering");
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SidebarProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Index />} />
                <Route path="trucks" element={<Trucks />} />
                <Route path="trucks/:id" element={<Trucks />} />
                <Route path="drivers" element={<Drivers />} />
                <Route path="drivers/:id" element={<Drivers />} />
                <Route path="destinations" element={<Destinations />} />
                <Route path="destinations/:id" element={<Destinations />} />
                <Route path="schedule" element={<Schedule />} />
                <Route path="tracking" element={<Tracking />} />
                <Route path="settings" element={<Settings />} />
                <Route path="help" element={<Help />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </SidebarProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
