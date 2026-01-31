import { motion } from "framer-motion";

interface HeaderProps {
  title?: string;
}

export function Header({ title = "UDYAMI AI" }: HeaderProps) {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40"
    >
      <div className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-4">
          <img src="/logo.svg" alt="Udyami AI Logo" className="w-10 h-10" />
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tighter">{title}</h1>
            <nav className="hidden md:flex items-center gap-6 text-[10px] uppercase tracking-[0.2em] font-medium">
              <span className="text-muted-foreground">Industrial Document Management</span>
            </nav>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground font-mono">
            {new Date().toLocaleDateString('en-IN', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            })}
          </span>
        </div>
      </div>
    </motion.header>
  );
}
