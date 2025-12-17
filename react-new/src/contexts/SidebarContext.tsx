import React, { createContext, useContext, useEffect, useState } from "react";

type SidebarContextType = {
  expanded: boolean;
  toggleSidebar: () => void;
  setExpanded: (v: boolean) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expanded, setExpanded] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem("sidebarExpanded");
      if (raw === null) return true;
      return raw === "true";
    } catch (e) {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("sidebarExpanded", String(expanded));
    } catch (e) {}
  }, [expanded]);

  const toggleSidebar = () => setExpanded((v) => !v);

  return (
    <SidebarContext.Provider value={{ expanded, toggleSidebar, setExpanded }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
};

export default SidebarContext;
