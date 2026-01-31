import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  User, 
  Lock, 
  Eye, 
  EyeOff,
  Factory,
  Shield,
  Users,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoginPageProps {
  onLogin: (user: { name: string; role: "admin" | "manager" | "staff" }) => void;
}

const demoUsers = [
  { 
    name: "Factory Owner", 
    email: "admin@udyami.com", 
    password: "admin123", 
    role: "admin" as const,
    icon: Shield,
    description: "Full access to all features"
  },
  { 
    name: "Production Manager", 
    email: "manager@udyami.com", 
    password: "manager123", 
    role: "manager" as const,
    icon: Factory,
    description: "Production and quality access"
  },
  { 
    name: "Staff Member", 
    email: "staff@udyami.com", 
    password: "staff123", 
    role: "staff" as const,
    icon: Users,
    description: "Limited access to reports"
  },
];

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = demoUsers.find(
      u => u.email === email.toLowerCase() && u.password === password
    );

    if (user) {
      onLogin({ name: user.name, role: user.role });
    } else {
      setError("Invalid email or password. Try one of the demo accounts below.");
    }

    setIsLoading(false);
  };

  const handleDemoLogin = (user: typeof demoUsers[0]) => {
    onLogin({ name: user.name, role: user.role });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground text-background flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Udyami AI</h1>
              <p className="text-xs text-background/60 uppercase tracking-wider">Industrial ERP</p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-4xl font-bold leading-tight mb-6">
              Control your entire factory with just a conversation
            </h2>
            <p className="text-lg text-background/70 leading-relaxed">
              AI-powered manufacturing operations management for Polymer/PVC industries.
              Generate quotations, invoices, production schedules, and quality reports 
              instantly through natural language.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Quotations", value: "50+" },
              { label: "Invoices", value: "50+" },
              { label: "Quality Reports", value: "50+" },
              { label: "AI Agents", value: "4" },
            ].map((stat, i) => (
              <div key={i} className="p-4 rounded-xl bg-background/10">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-background/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto w-full"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-background" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Udyami AI</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Industrial ERP</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-2">Welcome back</h2>
          <p className="text-muted-foreground mb-8">
            Sign in to access your manufacturing dashboard
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 mb-8">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Demo Accounts */}
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Quick demo access
                </span>
              </div>
            </div>

            <div className="grid gap-2">
              {demoUsers.map((user) => {
                const Icon = user.icon;
                return (
                  <button
                    key={user.role}
                    onClick={() => handleDemoLogin(user)}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-foreground/20 hover:bg-muted/50 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
