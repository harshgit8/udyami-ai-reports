import { motion } from "framer-motion";
import { StatsCard } from "./StatsCard";
import { 
  FileText, 
  Receipt, 
  ClipboardCheck, 
  Factory, 
  FlaskConical,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  BarChart3
} from "lucide-react";

interface DashboardOverviewProps {
  quotations: any[];
  invoices: any[];
  qualityReports: any[];
  productionOrders: any[];
  rndFormulations: any[];
  onNavigate: (tab: string) => void;
}

export function DashboardOverview({ 
  quotations, 
  invoices, 
  qualityReports, 
  productionOrders, 
  rndFormulations,
  onNavigate 
}: DashboardOverviewProps) {
  const totalQuotationValue = quotations.reduce((sum, q) => sum + (q.grandTotal || 0), 0);
  const totalInvoiceValue = invoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0);
  const totalBalanceDue = invoices.reduce((sum, i) => sum + (i.balanceDue || 0), 0);
  
  const acceptedQuality = qualityReports.filter(q => q.decision === 'ACCEPT').length;
  const rejectedQuality = qualityReports.filter(q => q.decision === 'REJECT').length;
  
  const scheduledProduction = productionOrders.filter(p => p.decision === 'PROCEED').length;
  const delayedProduction = productionOrders.filter(p => p.decision === 'DELAY').length;

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return `${value.toFixed(0)}`;
  };

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-foreground">
            <BarChart3 className="w-5 h-5 text-background" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <p className="text-muted-foreground">
          Overview of all documents and operations across your manufacturing facility
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Quotations"
          value={quotations.length}
          subtitle={`Value: INR ${formatCurrency(totalQuotationValue)}`}
          icon={FileText}
          trend="up"
          trendValue={`${quotations.filter(q => q.winProbability === 'HIGH').length} high prob`}
          color="blue"
        />
        <StatsCard
          title="Active Invoices"
          value={invoices.length}
          subtitle={`Due: INR ${formatCurrency(totalBalanceDue)}`}
          icon={Receipt}
          trend="neutral"
          trendValue={`INR ${formatCurrency(totalInvoiceValue)}`}
          color="emerald"
        />
        <StatsCard
          title="Quality Reports"
          value={qualityReports.length}
          subtitle={`${acceptedQuality} accepted, ${rejectedQuality} rejected`}
          icon={ClipboardCheck}
          trend={rejectedQuality > 0 ? 'down' : 'up'}
          trendValue={`${((acceptedQuality / (qualityReports.length || 1)) * 100).toFixed(0)}% pass`}
          color="purple"
        />
        <StatsCard
          title="Production Orders"
          value={productionOrders.length}
          subtitle={`${scheduledProduction} scheduled`}
          icon={Factory}
          trend={delayedProduction > 0 ? 'down' : 'up'}
          trendValue={`${delayedProduction} delayed`}
          color="amber"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { id: 'quotations', label: 'Quotations', count: quotations.length, icon: FileText, color: 'bg-blue-500/10 text-blue-600', desc: 'Customer quotes with AI insights' },
            { id: 'invoices', label: 'Invoices', count: invoices.length, icon: Receipt, color: 'bg-emerald-500/10 text-emerald-600', desc: 'Track payments and billing' },
            { id: 'quality', label: 'Quality Inspection', count: qualityReports.length, icon: ClipboardCheck, color: 'bg-purple-500/10 text-purple-600', desc: 'Defect analysis and reports' },
            { id: 'production', label: 'Production Schedule', count: productionOrders.length, icon: Factory, color: 'bg-amber-500/10 text-amber-600', desc: 'Orders and scheduling' },
            { id: 'rnd', label: 'R&D Formulations', count: rndFormulations.length, icon: FlaskConical, color: 'bg-rose-500/10 text-rose-600', desc: 'Compliance and formulations' },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -2 }}
                onClick={() => onNavigate(item.id)}
                className="p-5 rounded-xl border border-border bg-card hover:border-foreground/20 hover:shadow-lg transition-all text-left group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-semibold">{item.label}</h3>
                    <span className="text-xs text-muted-foreground">{item.count}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.desc}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Alerts Section */}
      {(delayedProduction > 0 || rejectedQuality > 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-5 rounded-xl border border-amber-200 bg-amber-500/5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-semibold">Attention Required</h3>
          </div>
          <div className="space-y-2 text-sm">
            {delayedProduction > 0 && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {delayedProduction} production orders are delayed and require attention
              </div>
            )}
            {rejectedQuality > 0 && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                {rejectedQuality} quality inspections have been rejected
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Success Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: "Total Revenue", value: `INR ${formatCurrency(totalInvoiceValue)}`, color: "text-emerald-600" },
          { label: "Production Rate", value: `${((scheduledProduction / (productionOrders.length || 1)) * 100).toFixed(0)}%`, color: "text-blue-600" },
          { label: "Quality Pass", value: `${((acceptedQuality / (qualityReports.length || 1)) * 100).toFixed(0)}%`, color: "text-purple-600" },
          { label: "R&D Projects", value: rndFormulations.length.toString(), color: "text-rose-600" },
        ].map((stat, i) => (
          <div key={i} className="p-4 rounded-xl bg-muted/50 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
