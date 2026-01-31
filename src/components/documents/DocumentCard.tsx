import { motion } from "framer-motion";
import { Eye, Download, ChevronRight } from "lucide-react";

interface DocumentCardProps {
  title: string;
  subtitle: string;
  value?: string;
  status?: 'success' | 'warning' | 'error' | 'neutral';
  statusLabel?: string;
  metadata?: { label: string; value: string }[];
  onView?: () => void;
  onDownload?: () => void;
}

const statusStyles = {
  success: 'bg-background text-foreground border-foreground',
  warning: 'bg-muted text-muted-foreground border-muted-foreground',
  error: 'bg-foreground text-background border-foreground',
  neutral: 'bg-muted text-foreground border-border',
};

export function DocumentCard({
  title,
  subtitle,
  value,
  status = 'neutral',
  statusLabel,
  metadata = [],
  onView,
  onDownload,
}: DocumentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="document-card group cursor-pointer"
      onClick={onView}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1 truncate">{subtitle}</p>
        </div>
        {statusLabel && (
          <span className={`status-badge ${statusStyles[status]} ml-4 flex-shrink-0`}>
            {statusLabel}
          </span>
        )}
      </div>

      {value && (
        <div className="mb-4">
          <span className="text-2xl font-semibold tracking-tight">{value}</span>
        </div>
      )}

      {metadata.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {metadata.map((item, index) => (
            <div key={index} className="text-xs">
              <span className="text-muted-foreground">{item.label}: </span>
              <span className="font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); onView?.(); }}
            className="p-2 hover:bg-muted transition-colors"
            title="View Document"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDownload?.(); }}
            className="p-2 hover:bg-muted transition-colors"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </div>
    </motion.div>
  );
}
