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
  CheckCircle
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
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value.toFixed(0)}`;
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of all documents and operations
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Quotations"
          value={quotations.length}
          subtitle={`Value: ${formatCurrency(totalQuotationValue)}`}
          icon={FileText}
          trend="up"
          trendValue={`${quotations.filter(q => q.winProbability === 'HIGH').length} high prob`}
        />
        <StatsCard
          title="Active Invoices"
          value={invoices.length}
          subtitle={`Due: ${formatCurrency(totalBalanceDue)}`}
          icon={Receipt}
          trend="neutral"
          trendValue={formatCurrency(totalInvoiceValue)}
        />
        <StatsCard
          title="Quality Reports"
          value={qualityReports.length}
          subtitle={`${acceptedQuality} accepted, ${rejectedQuality} rejected`}
          icon={ClipboardCheck}
          trend={rejectedQuality > 0 ? 'down' : 'up'}
          trendValue={`${((acceptedQuality / (qualityReports.length || 1)) * 100).toFixed(0)}% pass`}
        />
        <StatsCard
          title="Production Orders"
          value={productionOrders.length}
          subtitle={`${scheduledProduction} scheduled`}
          icon={Factory}
          trend={delayedProduction > 0 ? 'down' : 'up'}
          trendValue={`${delayedProduction} delayed`}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.button
          whileHover={{ y: -2 }}
          onClick={() => onNavigate('quotations')}
          className="p-6 border border-border hover:border-foreground transition-colors text-left group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-foreground text-background">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold">Quotations</h3>
              <p className="text-sm text-muted-foreground">{quotations.length} documents</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            View and manage customer quotations with AI insights
          </p>
        </motion.button>

        <motion.button
          whileHover={{ y: -2 }}
          onClick={() => onNavigate('invoices')}
          className="p-6 border border-border hover:border-foreground transition-colors text-left group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-foreground text-background">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold">Invoices</h3>
              <p className="text-sm text-muted-foreground">{invoices.length} documents</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Track invoices and payment status
          </p>
        </motion.button>

        <motion.button
          whileHover={{ y: -2 }}
          onClick={() => onNavigate('quality')}
          className="p-6 border border-border hover:border-foreground transition-colors text-left group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-foreground text-background">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold">Quality Inspection</h3>
              <p className="text-sm text-muted-foreground">{qualityReports.length} reports</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Review quality inspection results and defect analysis
          </p>
        </motion.button>

        <motion.button
          whileHover={{ y: -2 }}
          onClick={() => onNavigate('production')}
          className="p-6 border border-border hover:border-foreground transition-colors text-left group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-foreground text-background">
              <Factory className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold">Production Schedule</h3>
              <p className="text-sm text-muted-foreground">{productionOrders.length} orders</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            View production orders and scheduling decisions
          </p>
        </motion.button>

        <motion.button
          whileHover={{ y: -2 }}
          onClick={() => onNavigate('rnd')}
          className="p-6 border border-border hover:border-foreground transition-colors text-left group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-foreground text-background">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold">R&D Formulations</h3>
              <p className="text-sm text-muted-foreground">{rndFormulations.length} formulations</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Explore R&D formulations and compliance data
          </p>
        </motion.button>
      </div>

      {/* Alerts Section */}
      {(delayedProduction > 0 || rejectedQuality > 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 border border-border bg-muted"
        >
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-semibold">Attention Required</h3>
          </div>
          <div className="space-y-2 text-sm">
            {delayedProduction > 0 && (
              <p className="text-muted-foreground">
                • {delayedProduction} production orders are delayed and require attention
              </p>
            )}
            {rejectedQuality > 0 && (
              <p className="text-muted-foreground">
                • {rejectedQuality} quality inspections have been rejected
              </p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
