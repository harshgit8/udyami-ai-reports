import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Search, Settings, RefreshCw } from "lucide-react";
import { NotificationsPanel } from "./NotificationsPanel";
import { SettingsPanel } from "./SettingsPanel";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title?: string;
  onSync?: () => void;
  syncing?: boolean;
}

export function Header({ title = "UDYAMI AI", onSync, syncing }: HeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-40 relative"
    >
      <div className="flex items-center justify-between px-3 sm:px-6 py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-foreground flex items-center justify-center overflow-hidden">
            <img src="/logo.svg" alt="Udyami AI" className="w-5 h-5 sm:w-6 sm:h-6 invert" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xs sm:text-sm font-bold tracking-tight">{title}</h1>
            <span className="text-[9px] sm:text-[10px] text-muted-foreground tracking-wide hidden sm:block">
              AI Operating System for Manufacturing
            </span>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2">
          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search modules..."
              className="bg-transparent text-xs outline-none w-48 placeholder:text-muted-foreground"
            />
            <kbd className="text-[10px] text-muted-foreground bg-background rounded px-1.5 py-0.5">⌘K</kbd>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          {onSync && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSync}
              disabled={syncing}
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground rounded-lg gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{syncing ? "Syncing…" : "Sync"}</span>
            </Button>
          )}
          <button
            onClick={() => { setNotifOpen(!notifOpen); setSettingsOpen(false); }}
            className={`relative p-1.5 sm:p-2 rounded-lg transition-colors ${notifOpen ? "bg-muted" : "hover:bg-muted"}`}
          >
            <Bell className="w-4 h-4 text-muted-foreground" />
            <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-1.5 h-1.5 rounded-full bg-foreground" />
          </button>
          <button
            onClick={() => { setSettingsOpen(!settingsOpen); setNotifOpen(false); }}
            className={`p-1.5 sm:p-2 rounded-lg transition-colors ${settingsOpen ? "bg-muted" : "hover:bg-muted"}`}
          >
            <Settings className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${settingsOpen ? "rotate-90" : ""}`} />
          </button>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] sm:text-xs font-medium">
            OP
          </div>
        </div>
      </div>

      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </motion.header>
  );
}
