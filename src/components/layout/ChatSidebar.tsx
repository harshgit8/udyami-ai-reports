import { motion } from "framer-motion";
import { 
  MessageSquare,
  LayoutDashboard,
  FileText, 
  Receipt, 
  ClipboardCheck, 
  Factory, 
  FlaskConical,
  Settings,
  User,
  LogOut,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AgentStatusPanel } from "@/components/agents/AgentStatusPanel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  isCollapsed?: boolean;
  onLogout?: () => void;
  userRole?: string;
  userName?: string;
}

const navigationItems = [
  { id: 'chat', label: 'AI Chat', icon: MessageSquare, primary: true },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'quotations', label: 'Quotations', icon: FileText },
  { id: 'invoices', label: 'Invoices', icon: Receipt },
  { id: 'quality', label: 'Quality', icon: ClipboardCheck },
  { id: 'production', label: 'Production', icon: Factory },
  { id: 'rnd', label: 'R&D', icon: FlaskConical },
];

export function ChatSidebar({ 
  activeView, 
  onViewChange, 
  isCollapsed = false,
  onLogout,
  userRole = "Admin",
  userName = "Factory Owner"
}: ChatSidebarProps) {
  return (
    <motion.aside 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex flex-col bg-card border-r border-border h-screen sticky top-0 ${
        isCollapsed ? "w-16" : "w-80"
      }`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-background" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-bold tracking-tight">Udyami AI</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Industrial ERP
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive 
                    ? 'bg-foreground text-background font-medium' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                } ${item.primary && !isActive ? 'bg-muted/50' : ''}`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.primary && !isActive && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-foreground/10 text-foreground">
                        AI
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>

        {!isCollapsed && (
          <>
            <Separator className="my-2" />
            <AgentStatusPanel />
          </>
        )}
      </div>

      {/* User Profile */}
      <div className="p-3 border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-muted transition-colors">
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium truncate">{userName}</p>
                  <p className="text-xs text-muted-foreground">{userRole}</p>
                </div>
              )}
              {!isCollapsed && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.aside>
  );
}
