import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface AgentStep { label: string; agent: string; status: "pending" | "running" | "done"; }

const emissionsData = [
  { product: "Widget A", emissions: 2.1, target: 1.8 },
  { product: "Widget B", emissions: 3.4, target: 2.5 },
  { product: "Widget C", emissions: 1.6, target: 1.5 },
  { product: "Widget D", emissions: 2.8, target: 2.0 },
  { product: "Widget E", emissions: 4.1, target: 3.0 },
];

export function CarbonFootprintDetail() {
  const [viewState, setViewState] = useState<"idle" | "scanning" | "report">("idle");
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleScan = () => {
    setViewState("scanning");
    setAgentSteps([
      { label: "Collecting energy consumption per machine", agent: "EnergyCollector", status: "pending" },
      { label: "Calculating CO₂ emissions per product line", agent: "EmissionsCalculator", status: "pending" },
      { label: "Benchmarking against sustainability targets", agent: "SustainabilityBenchmark", status: "pending" },
      { label: "Generating reduction recommendations", agent: "GreenOptimizer", status: "pending" },
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

  return (
    <div className="space-y-6 pb-4">
      <AnimatePresence mode="wait">
        {viewState === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-[hsl(142,71%,45%/0.1)] flex items-center justify-center mb-4"><Leaf className="w-8 h-8 text-[hsl(142,71%,45%)]" /></div>
            <h2 className="text-xl font-semibold mb-1">Carbon Footprint Tracker</h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-md text-center">Track CO₂ emissions per product and get AI recommendations to reduce environmental impact.</p>
            <Button onClick={handleScan} className="gap-2 h-11 px-6 rounded-xl"><Leaf className="w-4 h-4" /> Run Sustainability Scan</Button>
          </motion.div>
        )}
        {viewState === "scanning" && (
          <motion.div key="scanning" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-16">
            <Loader2 className="w-12 h-12 animate-spin mb-6 text-[hsl(142,71%,45%)]" />
            <h3 className="text-lg font-medium mb-8">Scanning Emissions Data</h3>
            <div className="w-full max-w-md space-y-3">
              {agentSteps.map((step, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${step.status === "running" ? "border-[hsl(142,71%,45%/0.2)] bg-[hsl(142,71%,45%/0.03)]" : step.status === "done" ? "border-border opacity-60" : "border-transparent opacity-30"}`}>
                  <div className="w-5 h-5 flex items-center justify-center mt-0.5">
                    {step.status === "done" ? <CheckCircle2 className="w-4 h-4 text-[hsl(142,71%,45%)]" /> : step.status === "running" ? <Loader2 className="w-4 h-4 animate-spin text-[hsl(142,71%,45%)]" /> : <div className="w-2 h-2 rounded-full bg-muted-foreground" />}
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
                <div className="w-10 h-10 rounded-xl bg-[hsl(142,71%,45%/0.1)] flex items-center justify-center"><Leaf className="w-5 h-5 text-[hsl(142,71%,45%)]" /></div>
                <div><h2 className="text-lg font-semibold">Sustainability Report</h2><p className="text-xs text-muted-foreground">5 product lines analyzed</p></div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setViewState("idle")} className="rounded-xl">Rescan</Button>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[{ label: "Avg CO₂/unit", value: "2.8 kg" }, { label: "Score", value: "72/100" }, { label: "On Target", value: "2/5" }, { label: "Trend", value: "-8%" }].map(m => (
                <div key={m.label} className="p-3 rounded-xl bg-muted/30 text-center"><p className="text-[10px] text-muted-foreground">{m.label}</p><p className="text-lg font-bold">{m.value}</p></div>
              ))}
            </div>
            <div className="mb-6">
              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Emissions vs Target (kg CO₂/unit)</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={emissionsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 90%)" />
                  <XAxis dataKey="product" tick={{ fontSize: 11 }} stroke="hsl(0 0% 45%)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(0 0% 45%)" />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(0 0% 90%)", fontSize: 12 }} />
                  <Bar dataKey="emissions" fill="hsl(0 0% 70%)" radius={[4,4,0,0]} name="Actual" />
                  <Bar dataKey="target" fill="hsl(142, 71%, 45%)" radius={[4,4,0,0]} name="Target" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="p-4 rounded-xl border border-[hsl(142,71%,45%/0.2)] bg-[hsl(142,71%,45%/0.03)]">
              <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5"><Leaf className="w-3.5 h-3.5 text-[hsl(142,71%,45%)]" /> AI Recommendations</h4>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li>• Switch Widget B to recycled ABS — reduces emissions by 28%</li>
                <li>• Optimize M2 extrusion temperature — 15% energy savings</li>
                <li>• Consolidate Widget D & E batches — fewer machine startups</li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
