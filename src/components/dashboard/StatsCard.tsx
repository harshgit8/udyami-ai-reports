import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose';
}

const colorClasses = {
  blue: 'bg-blue-500/10 text-blue-600',
  emerald: 'bg-emerald-500/10 text-emerald-600',
  amber: 'bg-amber-500/10 text-amber-600',
  purple: 'bg-purple-500/10 text-purple-600',
  rose: 'bg-rose-500/10 text-rose-600',
};

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  trend,
  trendValue,
  color = 'blue'
}: StatsCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-border/80 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && trendValue && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            trend === 'up' ? 'bg-emerald-500/10 text-emerald-600' : 
            trend === 'down' ? 'bg-rose-500/10 text-rose-600' : 
            'bg-muted text-muted-foreground'
          }`}>
            <TrendIcon className="w-3 h-3" />
            {trendValue}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
          {title}
        </h3>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}
