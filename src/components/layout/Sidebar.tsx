import { motion } from "framer-motion";
import { 
  FileText, 
  Receipt, 
  ClipboardCheck, 
  Factory, 
  FlaskConical,
  LayoutDashboard
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'quotations', label: 'Quotations', icon: FileText },
  { id: 'invoices', label: 'Invoices', icon: Receipt },
  { id: 'quality', label: 'Quality', icon: ClipboardCheck },
  { id: 'production', label: 'Production', icon: Factory },
  { id: 'rnd', label: 'R&D', icon: FlaskConical },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <motion.aside 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-64 border-r border-border bg-sidebar min-h-screen"
    >
      <div className="p-6">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  isActive 
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 w-64 p-6 border-t border-sidebar-border">
        <div className="text-xs text-sidebar-foreground/60 space-y-1">
          <p className="font-medium">Udyami AI</p>
          <p>Industrial ERP System</p>
        </div>
      </div>
    </motion.aside>
  );
}
