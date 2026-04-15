import { motion, AnimatePresence } from "framer-motion";
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
  Menu,
  X,
  Workflow,
  Users,
  Clock,
  IndianRupee,
  Building2,
  Activity,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export interface BadgeCounts {
  quality?: number;
  production?: number;
  rnd?: number;
}

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  badgeCounts?: BadgeCounts;
}

const mainItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "chat", label: "Udyami", icon: MessageSquare },
  { id: "orchestrators", label: "AI Orchestrators", icon: Cpu },
  { id: "agent-comm", label: "Agent Comm", icon: Workflow },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

const moduleItems = [
  { id: "quotations", label: "Quotations", icon: FileText },
  { id: "invoices", label: "Invoices", icon: Receipt },
  { id: "quality", label: "Quality", icon: ClipboardCheck },
  { id: "production", label: "Production", icon: Factory },
  { id: "rnd", label: "R&D", icon: FlaskConical },
];

const enterpriseItems = [
  { id: "employees", label: "Employees", icon: Users },
  { id: "shifts", label: "Shifts", icon: Clock },
  { id: "salary", label: "Payroll", icon: IndianRupee },
  { id: "crm", label: "CRM", icon: Building2 },
  { id: "erp", label: "ERP Ops", icon: Activity },
  { id: "admin", label: "Admin", icon: Shield },
];

function SidebarContent({ activeTab, onTabChange, collapsed, showLabels }: { activeTab: string; onTabChange: (tab: string) => void; collapsed: boolean; showLabels: boolean }) {
  const renderSection = (label: string, items: typeof mainItems) => (
    <div>
      {showLabels && <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground px-3 mb-2">{label}</p>}
      <div className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button key={item.id} onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 rounded-lg transition-all duration-150 ${collapsed && !showLabels ? "justify-center px-2 py-2.5" : "px-3 py-2.5"} text-sm ${isActive ? "bg-foreground text-background font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}
              title={!showLabels ? item.label : undefined}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {showLabels && <span>{item.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex-1 py-4 px-2 space-y-5 overflow-y-auto">
      {renderSection("Main", mainItems)}
      {renderSection("Enterprise", enterpriseItems)}
      {renderSection("Modules", moduleItems)}
    </div>
  );
}

export function Sidebar({ activeTab, onTabChange, badgeCounts = {} }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    if (isMobile) setMobileOpen(false);
  };

  // Mobile: hamburger + slide-out drawer
  const activeModule = [...moduleItems, ...enterpriseItems].find((m) => m.id === activeTab);
  const isEnterpriseActive = enterpriseItems.some((m) => m.id === activeTab);
  const moreLabel = activeModule ? activeModule.label : "More";

  const bottomNavItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "chat", label: "Udyami", icon: MessageSquare },
    { id: "orchestrators", label: "AI Agents", icon: Cpu },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "more", label: moreLabel, icon: activeModule ? activeModule.icon : Menu },
  ];

  const totalModuleBadges = (badgeCounts.quality ?? 0) + (badgeCounts.production ?? 0) + (badgeCounts.rnd ?? 0);

  if (isMobile) {
    return (
      <>
        {/* Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border safe-area-bottom">
          <div className="flex items-center justify-around px-1 py-1.5">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const isModuleActive = [...moduleItems, ...enterpriseItems].some((m) => m.id === activeTab);
              const isActive = item.id === "more" ? (mobileOpen || isModuleActive) : activeTab === item.id;
              return (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.85 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  onClick={() => {
                    if (item.id === "more") {
                      setMobileOpen(!mobileOpen);
                    } else {
                      handleTabChange(item.id);
                    }
                  }}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[56px] ${
                    isActive
                      ? "text-foreground bg-accent"
                      : "text-muted-foreground"
                  }`}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {item.id === "more" && totalModuleBadges > 0 && !isActive && (
                      <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold px-1">
                        {totalModuleBadges}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium leading-tight">{item.label}</span>
                </motion.button>
              );
            })}
          </div>
        </nav>

        {/* "More" drawer for module items */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/40"
                onClick={() => setMobileOpen(false)}
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
                className="fixed bottom-[60px] left-0 right-0 z-40 bg-card rounded-t-2xl border-t border-border shadow-lg max-h-[50vh] overflow-y-auto"
              >
                <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-muted" />
                <div className="p-4 space-y-4">
                  {[{ label: "Enterprise", items: enterpriseItems }, { label: "Modules", items: moduleItems }].map(({ label, items }) => (
                    <div key={label}>
                      <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-3">{label}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {items.map((item) => {
                          const Icon = item.icon;
                          const isActive = activeTab === item.id;
                          return (
                            <button key={item.id} onClick={() => { handleTabChange(item.id); setMobileOpen(false); }}
                              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${isActive ? "bg-foreground text-background" : "bg-muted/50 text-foreground hover:bg-accent"}`}>
                              <Icon className="w-5 h-5" />
                              <span className="text-[11px] font-medium">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop/Tablet
  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0, width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2 }}
      className="border-r border-border bg-sidebar h-[calc(100vh-49px)] sticky top-[49px] flex flex-col overflow-hidden"
    >
      <SidebarContent activeTab={activeTab} onTabChange={onTabChange} collapsed={collapsed} showLabels={!collapsed} />
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
