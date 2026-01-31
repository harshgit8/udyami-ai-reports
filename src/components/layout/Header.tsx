import { motion } from "framer-motion";

interface HeaderProps {
  title?: string;
}

export function Header({ title = "UDYAMI AI" }: HeaderProps) {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-border bg-background"
    >
      <div className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <span className="text-muted-foreground">Industrial Document Management</span>
          </nav>
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
