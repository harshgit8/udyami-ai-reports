import { motion } from "framer-motion";
import { 
  Factory, 
  ClipboardCheck, 
  FlaskConical, 
  Briefcase,
  Activity,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: "active" | "processing" | "idle";
  lastAction?: string;
  metrics?: {
    label: string;
    value: string | number;
  }[];
}

const agents: Agent[] = [
  {
    id: "production",
    name: "Production Agent",
    description: "Plans batches, materials, scheduling",
    icon: Factory,
    status: "active",
    lastAction: "Scheduled 15 orders",
    metrics: [
      { label: "Scheduled", value: 958 },
      { label: "Delayed", value: 250 },
    ],
  },
  {
    id: "quality",
    name: "Quality Agent",
    description: "Testing results, defect analysis",
    icon: ClipboardCheck,
    status: "active",
    lastAction: "Analyzed batch QC_001",
    metrics: [
      { label: "Pass Rate", value: "94%" },
      { label: "Inspected", value: 50 },
    ],
  },
  {
    id: "rnd",
    name: "R&D Agent",
    description: "Formulations, improvements",
    icon: FlaskConical,
    status: "idle",
    lastAction: "Created 3 formulations",
    metrics: [
      { label: "Active", value: 29 },
      { label: "Ready", value: 12 },
    ],
  },
  {
    id: "business",
    name: "Business Agent",
    description: "Pricing, invoices, documents",
    icon: Briefcase,
    status: "processing",
    lastAction: "Generating quotation",
    metrics: [
      { label: "Quotes", value: 50 },
      { label: "Invoices", value: 50 },
    ],
  },
];

const statusConfig = {
  active: {
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
    icon: CheckCircle,
    label: "Active",
  },
  processing: {
    color: "text-amber-600",
    bg: "bg-amber-500/10",
    icon: Clock,
    label: "Processing",
  },
  idle: {
    color: "text-muted-foreground",
    bg: "bg-muted",
    icon: Activity,
    label: "Idle",
  },
};

export function AgentStatusPanel() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider">AI Agents</h3>
        <span className="text-xs text-muted-foreground">4 agents online</span>
      </div>

      <div className="space-y-3">
        {agents.map((agent, index) => {
          const Icon = agent.icon;
          const statusInfo = statusConfig[agent.status];
          const StatusIcon = statusInfo.icon;

          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-xl border border-border bg-card hover:border-foreground/20 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${statusInfo.bg}`}>
                  <Icon className={`w-4 h-4 ${statusInfo.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium truncate">{agent.name}</h4>
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                      <StatusIcon className="w-2.5 h-2.5" />
                      {statusInfo.label}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {agent.description}
                  </p>
                  {agent.lastAction && (
                    <p className="text-xs text-muted-foreground mt-1.5 truncate">
                      Last: {agent.lastAction}
                    </p>
                  )}
                  {agent.metrics && (
                    <div className="flex gap-3 mt-2">
                      {agent.metrics.map((metric, i) => (
                        <div key={i} className="text-xs">
                          <span className="text-muted-foreground">{metric.label}: </span>
                          <span className="font-medium">{metric.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
