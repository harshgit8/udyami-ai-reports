import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  trend,
  trendValue 
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 bg-muted">
          <Icon className="w-5 h-5" />
        </div>
        {trend && trendValue && (
          <span className={`text-xs font-medium ${
            trend === 'up' ? 'text-foreground' : 
            trend === 'down' ? 'text-muted-foreground' : 
            'text-muted-foreground'
          }`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
          {title}
        </h3>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}
