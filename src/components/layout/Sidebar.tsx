import { motion } from "framer-motion";
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Receipt,
  ClipboardCheck,
  Factory,
  FlaskConical,
  BarChart3,
  Cpu,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const mainItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "chat", label: "Udyami Copilot", icon: MessageSquare },
  { id: "orchestrators", label: "AI Orchestrators", icon: Cpu },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

const moduleItems = [
  { id: "quotations", label: "Quotations", icon: FileText },
  { id: "invoices", label: "Invoices", icon: Receipt },
  { id: "quality", label: "Quality", icon: ClipboardCheck },
  { id: "production", label: "Production", icon: Factory },
  { id: "rnd", label: "R&D", icon: FlaskConical },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0, width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2 }}
      className="border-r border-border bg-sidebar h-[calc(100vh-49px)] sticky top-[49px] flex flex-col overflow-hidden"
    >
      <div className="flex-1 py-4 px-2 space-y-6 overflow-hidden">
        {/* Main */}
        <div>
          {!collapsed && (
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground px-3 mb-2">
              Main
            </p>
          )}
          <div className="space-y-0.5">
            {mainItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-3 rounded-lg transition-all duration-150 ${
                    collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
                  } text-sm ${
                    isActive
                      ? "bg-foreground text-background font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modules */}
        <div>
          {!collapsed && (
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground px-3 mb-2">
              Modules
            </p>
          )}
          <div className="space-y-0.5">
            {moduleItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-3 rounded-lg transition-all duration-150 ${
                    collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
                  } text-sm ${
                    isActive
                      ? "bg-foreground text-background font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-sidebar-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </motion.aside>
  );
}
