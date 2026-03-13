import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, AlertTriangle, Shield, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface AgentStep { label: string; agent: string; status: "pending" | "running" | "done"; }

const workers = [
  { name: "Ramesh Patil", shift: "Morning", fatigue: 35, risk: "Low", hours: 6.5 },
  { name: "Suresh Jadhav", shift: "Morning", fatigue: 72, risk: "High", hours: 9.2 },
  { name: "Priya Sharma", shift: "Afternoon", fatigue: 45, risk: "Medium", hours: 7.0 },
  { name: "Amit Deshmukh", shift: "Afternoon", fatigue: 28, risk: "Low", hours: 5.5 },
  { name: "Kavita Nair", shift: "Night", fatigue: 85, risk: "Critical", hours: 11.0 },
  { name: "Raj Kulkarni", shift: "Morning", fatigue: 50, risk: "Medium", hours: 7.5 },
];

export function WorkforceWellbeingDetail() {
  const [viewState, setViewState] = useState<"idle" | "scanning" | "report">("idle");
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const handleScan = () => {
    setViewState("scanning");
    setAgentSteps([
      { label: "Collecting shift data & overtime records", agent: "ShiftMonitor", status: "pending" },
      { label: "Analyzing fatigue indicators per worker", agent: "FatigueDetector", status: "pending" },
      { label: "Assessing safety risk levels", agent: "SafetyAnalyzer", status: "pending" },
      { label: "Generating shift optimization plan", agent: "ShiftOptimizer", status: "pending" },
    ]);
  };
  useEffect(() => {
    if (viewState !== "scanning") return;
    let step = 0;
    const run = () => {
      if (step < agentSteps.length) {
        setAgentSteps(prev => prev.map((s, i) => ({ ...s, status: i === step ? "running" : i < step ? "done" : "pending" })));
        step++; timerRef.current = setTimeout(run, 900);
      } else {
        setAgentSteps(prev => prev.map(s => ({ ...s, status: "done" as const })));
        timerRef.current = setTimeout(() => setViewState("report"), 500);
      }
    };
    timerRef.current = setTimeout(run, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [viewState]);
  const highRisk = workers.filter(w => w.risk === "High" || w.risk === "Critical").length;
  const avgFatigue = Math.round(workers.reduce((a, b) => a + b.fatigue, 0) / workers.length);
  return (
    <div className="space-y-6 pb-4">
      <AnimatePresence mode="wait">
        {viewState === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-[hsl(0,84%,60%/0.1)] flex items-center justify-center mb-4"><Heart className="w-8 h-8 text-[hsl(0,84%,60%)]" /></div>
            <h2 className="text-xl font-semibold mb-1">Workforce Wellbeing AI</h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-md text-center">Detect fatigue, identify safety risks, and optimize shifts.</p>
            <Button onClick={handleScan} className="gap-2 h-11 px-6 rounded-xl"><Heart className="w-4 h-4" /> Run Wellbeing Scan</Button>
          </motion.div>
        )}
        {viewState === "scanning" && (
          <motion.div key="scanning" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-16">
            <Loader2 className="w-12 h-12 animate-spin mb-6 text-foreground/60" />
            <h3 className="text-lg font-medium mb-8">Scanning Workforce Data</h3>
            <div className="w-full max-w-md space-y-3">
              {agentSteps.map((step, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${step.status === "running" ? "border-foreground/20 bg-muted/30" : step.status === "done" ? "border-border opacity-60" : "border-transparent opacity-30"}`}>
                  <div className="w-5 h-5 flex items-center justify-center mt-0.5">
                    {step.status === "done" ? <CheckCircle2 className="w-4 h-4 text-[hsl(142,71%,45%)]" /> : step.status === "running" ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-2 h-2 rounded-full bg-muted-foreground" />}
                  </div>
                  <div><p className="text-sm font-medium">{step.label}</p><p className="text-[10px] text-muted-foreground">Agent: {step.agent}</p></div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        {viewState === "report" && (
          <motion.div key="report" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${highRisk > 0 ? "bg-[hsl(38,92%,50%/0.1)]" : "bg-[hsl(142,71%,45%/0.1)]"}`}>
                  {highRisk > 0 ? <AlertTriangle className="w-5 h-5 text-[hsl(38,92%,50%)]" /> : <CheckCircle2 className="w-5 h-5 text-[hsl(142,71%,45%)]" />}
                </div>
                <div><h2 className="text-lg font-semibold">Wellbeing Report</h2><p className="text-xs text-muted-foreground">{workers.length} workers · {highRisk} at risk</p></div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setViewState("idle")} className="rounded-xl">Rescan</Button>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[{ label: "Workers", value: workers.length }, { label: "Avg Fatigue", value: `${avgFatigue}%` }, { label: "High Risk", value: highRisk }, { label: "Overtime", value: workers.filter(w => w.hours > 8).length }].map(m => (
                <div key={m.label} className="p-3 rounded-xl bg-muted/30 text-center"><p className="text-[10px] text-muted-foreground">{m.label}</p><p className="text-lg font-bold">{m.value}</p></div>
              ))}
            </div>
            <div className="space-y-2 mb-6">
              {workers.map((w, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-3 rounded-xl border border-border flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{w.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${w.risk === "Low" ? "bg-[hsl(142,71%,45%/0.1)] text-[hsl(142,71%,45%)]" : w.risk === "Medium" ? "bg-[hsl(38,92%,50%/0.1)] text-[hsl(38,92%,50%)]" : "bg-[hsl(0,84%,60%/0.1)] text-[hsl(0,84%,60%)]"}`}>{w.risk}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1.5"><span>{w.shift}</span><span>{w.hours}h</span><span>{w.fatigue}%</span></div>
                    <Progress value={w.fatigue} className="h-1.5" />
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="p-4 rounded-xl border border-border">
              <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Shift Optimization</h4>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li>• <strong>Kavita Nair</strong> — 85% fatigue. Mandatory 24h rest.</li>
                <li>• <strong>Suresh Jadhav</strong> — 9.2h logged. Cap at 8h.</li>
                <li>• Add 1 worker to night shift to reduce individual hours.</li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
