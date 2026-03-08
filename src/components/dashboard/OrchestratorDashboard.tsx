import { useState } from "react";
import { motion } from "framer-motion";
import {
  Cpu, Calendar, FileText, Receipt, Shield, FlaskConical,
  Zap, TrendingUp, Users, Leaf, MessageCircle, Handshake,
  Heart, Dices, Activity, ArrowRight,
} from "lucide-react";
import { OrchestratorDetailPanel } from "@/components/orchestrators/OrchestratorDetailPanel";

interface OrchestratorCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  status: "active" | "idle" | "processing";
  metric?: string;
  metricLabel?: string;
  delay?: number;
  onClick: () => void;
}

function OrchestratorCard({ title, description, icon: Icon, status, metric, metricLabel, delay = 0, onClick }: OrchestratorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      onClick={onClick}
      className="glass-card-hover p-5 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-xl bg-foreground text-background group-hover:scale-110 transition-transform duration-200">
          <Icon className="w-5 h-5" />
        </div>
        <span
          className={`text-[10px] font-medium px-2 py-1 rounded-full ${
            status === "active"
              ? "bg-[hsl(142_71%_45%/0.1)] text-[hsl(142,71%,45%)]"
              : status === "processing"
              ? "bg-[hsl(38_92%_50%/0.1)] text-[hsl(38,92%,50%)]"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {status === "active" ? "● Active" : status === "processing" ? "◌ Processing" : "○ Idle"}
        </span>
      </div>
      <h3 className="font-semibold text-sm mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{description}</p>
      {metric && (
        <div className="pt-3 border-t border-border flex items-end justify-between">
          <div>
            <span className="text-lg font-semibold">{metric}</span>
            {metricLabel && <span className="text-xs text-muted-foreground ml-1">{metricLabel}</span>}
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}
      {!metric && (
        <div className="pt-3 border-t border-border flex items-center justify-end">
          <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">Open <ArrowRight className="w-3 h-3" /></span>
        </div>
      )}
    </motion.div>
  );
}

export function OrchestratorDashboard() {
  const [selectedOrchestrator, setSelectedOrchestrator] = useState<string | null>(null);

  const coreOrchestrators = [
    { id: "production-scheduling", title: "Production Scheduling AI", description: "Optimizes production schedules automatically based on machine capacity and orders.", icon: Calendar, status: "active" as const, metric: "94%", metricLabel: "utilization" },
    { id: "quotation-generator", title: "Quotation Generator AI", description: "Creates intelligent quotations based on costs, demand, and market analysis.", icon: FileText, status: "active" as const, metric: "127", metricLabel: "generated" },
    { id: "invoice-generation", title: "Invoice Generation AI", description: "Creates GST-compliant invoices with automatic calculations.", icon: Receipt, status: "active" as const, metric: "₹2.4Cr", metricLabel: "processed" },
    { id: "quality-intelligence", title: "Quality Intelligence AI", description: "Detects defects and analyzes production quality using sensor data.", icon: Shield, status: "processing" as const, metric: "97.2%", metricLabel: "pass rate" },
    { id: "rnd-formulation", title: "R&D Formulation AI", description: "Suggests new product formulations using genetic algorithms.", icon: FlaskConical, status: "active" as const, metric: "23", metricLabel: "formulations" },
  ];

  const advancedOrchestrators = [
    { id: "what-if-simulator", title: "What-If Scenario Simulator", description: "Simulate machine failure, material shortage, rush orders and price changes.", icon: Dices, status: "idle" as const, metric: "12", metricLabel: "scenarios" },
    { id: "predictive-pricing", title: "Predictive Pricing Engine", description: "AI recommends optimal selling price based on cost and market demand.", icon: TrendingUp, status: "active" as const, metric: "+8.3%", metricLabel: "margin" },
    { id: "production-recommendation", title: "Production Recommendation", description: "Netflix-style next product recommendation based on historical data.", icon: Zap, status: "active" as const, metric: "15%", metricLabel: "efficiency gain" },
    { id: "supplier-auction", title: "Supplier Reverse Auction", description: "Suppliers compete in real-time to offer the lowest price.", icon: Users, status: "idle" as const },
    { id: "carbon-footprint", title: "Carbon Footprint Tracker", description: "Tracks CO₂ emissions per product with sustainability scoring.", icon: Leaf, status: "active" as const, metric: "2.3kg", metricLabel: "CO₂/unit" },
    { id: "voice-of-customer", title: "Voice of Customer AI", description: "Analyzes customer reviews and complaints for sentiment insights.", icon: MessageCircle, status: "idle" as const, metric: "4.2/5", metricLabel: "sentiment" },
    { id: "negotiation-agents", title: "Auto-Negotiation Agents", description: "AI negotiates with suppliers automatically for best deals.", icon: Handshake, status: "idle" as const },
    { id: "workforce-wellbeing", title: "Workforce Wellbeing AI", description: "Detects worker fatigue, safety risks, and optimizes shifts.", icon: Heart, status: "processing" as const, metric: "Low", metricLabel: "risk" },
  ];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Cpu className="w-5 h-5" />
          <h1 className="text-2xl font-semibold tracking-tight">AI Orchestrators</h1>
        </div>
        <p className="text-sm text-muted-foreground">Autonomous AI agents managing factory operations · Click any card to explore</p>
      </motion.div>

      {/* System Status */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card p-4 flex items-center gap-4">
        <Activity className="w-5 h-5 text-[hsl(142,71%,45%)]" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">System Status: All Systems Operational</span>
            <span className="w-2 h-2 rounded-full bg-[hsl(142,71%,45%)] animate-pulse" />
          </div>
          <p className="text-xs text-muted-foreground">5 agents active · 2 processing · 3 idle · Last sync 2s ago</p>
        </div>
      </motion.div>

      {/* Core */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Core Orchestrators</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {coreOrchestrators.map((o, i) => (
            <OrchestratorCard key={o.id} {...o} delay={i * 0.05} onClick={() => setSelectedOrchestrator(o.id)} />
          ))}
        </div>
      </div>

      {/* Advanced */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Advanced AI Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {advancedOrchestrators.map((o, i) => (
            <OrchestratorCard key={o.id} {...o} delay={i * 0.05} onClick={() => setSelectedOrchestrator(o.id)} />
          ))}
        </div>
      </div>

      <OrchestratorDetailPanel orchestratorId={selectedOrchestrator} onClose={() => setSelectedOrchestrator(null)} />
    </div>
  );
}
