import { motion } from "framer-motion";
import { StatsCard } from "./StatsCard";
import {
  FileText,
  Receipt,
  ClipboardCheck,
  Factory,
  FlaskConical,
  AlertTriangle,
  Activity,
  TrendingUp,
  Zap,
  ArrowRight,
} from "lucide-react";
import type { Invoice, ProductionOrder, QualityInspection, Quotation, RnDFormulation } from "@/types/documents";

type WithId<T> = Partial<T> & { id: string };

interface DashboardOverviewProps {
  quotations: Array<WithId<Quotation>>;
  invoices: Array<WithId<Invoice>>;
  qualityReports: Array<WithId<QualityInspection>>;
  productionOrders: Array<WithId<ProductionOrder>>;
  rndFormulations: Array<WithId<RnDFormulation>>;
  onNavigate: (tab: string) => void;
}

export function DashboardOverview({
  quotations,
  invoices,
  qualityReports,
  productionOrders,
  rndFormulations,
  onNavigate,
}: DashboardOverviewProps) {
  const totalQuotationValue = quotations.reduce((sum, q) => sum + (q.grandTotal || 0), 0);
  const totalInvoiceValue = invoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0);
  const totalBalanceDue = invoices.reduce((sum, i) => sum + (i.balanceDue || 0), 0);
  const acceptedQuality = qualityReports.filter((q) => q.decision === "ACCEPT").length;
  const rejectedQuality = qualityReports.filter((q) => q.decision === "REJECT").length;
  const scheduledProduction = productionOrders.filter((p) => p.decision === "PROCEED").length;
  const delayedProduction = productionOrders.filter((p) => p.decision === "DELAY").length;

  const fmt = (v: number) => {
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
    if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
    return `₹${v.toFixed(0)}`;
  };

  const modules = [
    { id: "quotations", label: "Quotations", icon: FileText, count: quotations.length, desc: "AI-powered pricing and proposals" },
    { id: "invoices", label: "Invoices", icon: Receipt, count: invoices.length, desc: "GST-compliant invoice generation" },
    { id: "quality", label: "Quality Control", icon: ClipboardCheck, count: qualityReports.length, desc: "Defect detection and analysis" },
    { id: "production", label: "Production", icon: Factory, count: productionOrders.length, desc: "Schedule optimization" },
    { id: "rnd", label: "R&D Lab", icon: FlaskConical, count: rndFormulations.length, desc: "Material formulation AI" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold tracking-tight">Good morning, Operator</h1>
        <p className="text-sm text-muted-foreground mt-1">Here's your factory overview for today</p>
      </motion.div>

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-4 flex items-center gap-4"
      >
        <Activity className="w-5 h-5 text-[hsl(142,71%,45%)]" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">All Systems Operational</span>
            <span className="w-2 h-2 rounded-full bg-[hsl(142,71%,45%)] animate-pulse" />
          </div>
          <p className="text-xs text-muted-foreground">
            {quotations.length + invoices.length + qualityReports.length + productionOrders.length + rndFormulations.length} documents loaded · AI agents ready
          </p>
        </div>
        <button onClick={() => onNavigate("orchestrators")} className="text-xs font-medium flex items-center gap-1 hover:underline">
          View Agents <ArrowRight className="w-3 h-3" />
        </button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard
          title="Quotation Pipeline"
          value={quotations.length}
          subtitle={`Value: ${fmt(totalQuotationValue)}`}
          icon={FileText}
          trend="up"
          trendValue={`${quotations.filter((q) => q.winProbability === "HIGH").length} high prob`}
          delay={0.05}
        />
        <StatsCard
          title="Active Invoices"
          value={invoices.length}
          subtitle={`Due: ${fmt(totalBalanceDue)}`}
          icon={Receipt}
          trend="neutral"
          trendValue={fmt(totalInvoiceValue)}
          delay={0.1}
        />
        <StatsCard
          title="Quality Score"
          value={`${((acceptedQuality / (qualityReports.length || 1)) * 100).toFixed(0)}%`}
          subtitle={`${acceptedQuality} accepted, ${rejectedQuality} rejected`}
          icon={ClipboardCheck}
          trend={rejectedQuality > 0 ? "down" : "up"}
          trendValue={`${qualityReports.length} inspections`}
          delay={0.15}
        />
        <StatsCard
          title="Production"
          value={productionOrders.length}
          subtitle={`${scheduledProduction} scheduled`}
          icon={Factory}
          trend={delayedProduction > 0 ? "down" : "up"}
          trendValue={`${delayedProduction} delayed`}
          delay={0.2}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {modules.map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.button
                key={m.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.05 }}
                whileHover={{ y: -2 }}
                onClick={() => onNavigate(m.id)}
                className="glass-card-hover p-4 text-left group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-foreground text-background">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-lg font-semibold">{m.count}</span>
                </div>
                <h3 className="text-sm font-medium mb-0.5">{m.label}</h3>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* AI Insights */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4" />
          <h3 className="text-sm font-medium">AI Insights</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-muted">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-[hsl(142,71%,45%)]" />
              <span className="text-xs font-medium">Production Efficiency</span>
            </div>
            <p className="text-xs text-muted-foreground">Production efficiency increased 12% this week through AI schedule optimization.</p>
          </div>
          <div className="p-3 rounded-xl bg-muted">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-[hsl(38,92%,50%)]" />
              <span className="text-xs font-medium">Attention Required</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {delayedProduction > 0
                ? `${delayedProduction} production orders delayed. Review scheduling.`
                : "All production orders on track."}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-muted">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Recommendation</span>
            </div>
            <p className="text-xs text-muted-foreground">Consider manufacturing widget_b next – 15% changeover reduction predicted.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
