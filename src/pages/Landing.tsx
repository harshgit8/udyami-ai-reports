import { motion } from "framer-motion";
import { ArrowRight, Factory, Zap, Shield, BarChart3, Brain, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Factory, title: "Production Intelligence", desc: "AI-optimized scheduling across all machines" },
  { icon: Zap, title: "Instant Quotations", desc: "Generate accurate quotes in under 2 minutes" },
  { icon: Shield, title: "Quality Assurance", desc: "Real-time batch monitoring & defect prevention" },
  { icon: BarChart3, title: "Smart Analytics", desc: "Actionable insights from your factory data" },
  { icon: Brain, title: "R&D Formulations", desc: "AI-suggested recipes from 50,000+ compounds" },
  { icon: Sparkles, title: "AI Orchestrators", desc: "Autonomous agents running your operations" },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between px-6 sm:px-12 py-5 border-b border-border/50"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-foreground flex items-center justify-center">
            <img src="/logo.svg" alt="Udyami" className="w-6 h-6 invert" />
          </div>
          <span className="text-lg font-bold tracking-tight">UDYAMI AI</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard")}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Dashboard →
        </Button>
      </motion.nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center max-w-3xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted border border-border text-xs font-medium text-muted-foreground mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))] animate-pulse" />
            AI Operating System for Manufacturing
          </motion.div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Your factory,
            <br />
            <span className="gradient-text">powered by AI.</span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            Quotations in 2 minutes. Quality reports in 8 seconds. Production scheduling that thinks ahead. 
            Meet the AI that runs your manufacturing floor.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={() => navigate("/onboarding")}
              className="h-12 px-8 text-sm font-medium rounded-xl gap-2 group"
            >
              Get Started
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/dashboard")}
              className="h-12 px-8 text-sm font-medium rounded-xl"
            >
              View Demo Dashboard
            </Button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 max-w-3xl w-full mt-20"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
              className="glass-card-hover p-5 sm:p-6 group cursor-default"
            >
              <f.icon className="w-5 h-5 text-muted-foreground mb-3 transition-colors group-hover:text-foreground" />
              <h3 className="text-sm font-semibold mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-8 sm:gap-16 mt-16 text-center"
        >
          {[
            { value: "91%", label: "Machine Utilisation" },
            { value: "97.2%", label: "Quality Pass Rate" },
            { value: "< 2 min", label: "Quotation Time" },
            { value: "₹7 Cr+", label: "Revenue Impact" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-muted-foreground border-t border-border/50">
        Udyami AI — AI Operating System for Manufacturing
      </footer>
    </div>
  );
}
