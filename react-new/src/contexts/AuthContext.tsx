import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  email: string;
  role: "admin";
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem("galang_user");
      return raw ? (JSON.parse(raw) as User) : null;
    } catch (e) {
      return null;
    }
  });

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simple validation - any email and password works for admin
    if (email && password && password.length >= 4) {
      const newUser: User = { email, role: "admin" };
      setUser(newUser);
      localStorage.setItem("galang_user", JSON.stringify(newUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("galang_user");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
