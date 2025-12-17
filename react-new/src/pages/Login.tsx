import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Truck, Lock, Mail, Eye, EyeOff, ArrowRight } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    if (password.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast.success("Welcome back, Admin!");
        navigate("/");
      } else {
        toast.error("Login failed. Please try again.");
      }
    } catch {
      toast.error("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-sidebar-background via-[hsl(223,57%,18%)] to-sidebar-background">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-sidebar-primary/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-status-available/10 rounded-full blur-3xl animate-pulse delay-500" />
        </div>
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `linear-gradient(hsl(var(--sidebar-foreground)) 1px, transparent 1px),
                             linear-gradient(90deg, hsl(var(--sidebar-foreground)) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }} />
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-sidebar-foreground">
          <div className="flex items-center gap-4 mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/50 rounded-2xl blur-xl animate-pulse" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
                <Truck className="h-9 w-9 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-green-600">GaLang</h1>
          </div>
          <p className="text-xl text-green-600 text-center max-w-md mb-12">
            Your complete fleet management solution for modern logistics operations
          </p>
          <div className="space-y-4 w-full max-w-sm">
            {[
              { icon: "🚛", text: "Truck Management" },
              { icon: "👥", text: "Driver Management" },
              { icon: "🗺️", text: "Tracking Management" },
              { icon: "📊", text: "Analytics Dashboard" },
            ].map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 rounded-xl bg-sidebar-accent/30 backdrop-blur-sm border border-sidebar-border/50 transform hover:scale-105 transition-transform duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <span className="text-2xl">{feature.icon}</span>
                <span className="text-sidebar-foreground/90 font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Truck className="h-7 w-7 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-green-600">GaLang</span>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back</h2>
            <p className="text-muted-foreground">Sign in to access your admin dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="email" type="email" placeholder="admin@galang.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12 bg-secondary/50 border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 h-12 bg-secondary/50 border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 group">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Sign In as Admin</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>
          </form>

          <div className="p-4 rounded-xl bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground text-center"><span className="font-medium text-foreground">Demo Access:</span> Use any email and password (min 4 characters) to login as admin</p>
          </div>

          <p className="text-center text-sm text-muted-foreground">© 2025 Driver and Truck Assigning Management System</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
